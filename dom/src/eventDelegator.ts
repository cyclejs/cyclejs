import { Producer, Subject, pipe, subscribe } from '@cycle/callbags';
import {
  AddEventListenerCommand,
  RemoveEventListenerCommand,
  DomEvent,
  PatchedEvent,
} from './types';
import { NamespaceTree, TreeNode } from './namespaceTree';
import { ID } from '@cycle/run';

export class EventDelegator {
  private root: Element | DocumentFragment | undefined;
  private rootListeners = new Map<string, Map<boolean, (ev: Event) => void>>();
  private documentListeners = new Map<
    string,
    Map<boolean, (ev: Event) => void>
  >();
  private bodyListeners = new Map<string, Map<boolean, (ev: Event) => void>>();
  private listenersToAdd: Array<[string, (ev: Event) => void]> = [];

  constructor(
    private namespaceTree: NamespaceTree,
    rootElement$: Producer<Element | DocumentFragment>,
    private subject: Subject<DomEvent>
  ) {
    pipe(
      rootElement$,
      subscribe(elem => {
        if (this.root !== elem) {
          this.root = elem;
          if (this.listenersToAdd.length > 0) {
            for (const [type, listener] of this.listenersToAdd) {
              this.root.addEventListener(type, listener);
            }
          }
        }
      })
    );
  }

  public addEventListener(cmd: AddEventListenerCommand): void {
    //TODO: Handle non-bubbling event listeners

    const capture = cmd.options?.capture ?? false;
    if (cmd.selector === 'document') {
      const listener = (ev: Event) => {
        this.subject(1, patchEvent(ev, cmd.id, document));
      };
      setDeep(this.documentListeners, cmd.type, capture, listener, () => {
        document.addEventListener(cmd.type, listener, cmd.options);
      });
    } else if (cmd.selector === 'body') {
      const listener = (ev: Event) => {
        this.subject(1, patchEvent(ev, cmd.id, document.body));
      };
      setDeep(this.bodyListeners, cmd.type, capture, listener, () => {
        document.body.addEventListener(cmd.type, listener, cmd.options);
      });
    } else {
      const listener = (ev: Event) => {
        this.onEvent(ev);
      };

      this.namespaceTree.insertVirtualListener(cmd);
      setDeep(this.rootListeners, cmd.type, capture, listener, () => {
        if (this.root) {
          this.root.addEventListener(cmd.type, listener);
        } else {
          this.listenersToAdd.push([cmd.type, listener]);
        }
      });
    }
  }

  public removeEventListener(cmd: RemoveEventListenerCommand): void {
    //TODO: Implement this
  }

  private onEvent(e: Event): void {
    const ev = patchStopPropagation(e);
    const tree = this.namespaceTree.getNamespaceRoot(ev.target as Element);

    const traverseNode = (
      node: TreeNode,
      elem: Element,
      capturePhase: boolean
    ) => {
      if (ev.propagationStopped) {
        return;
      }
      const listeners = node.getListeners(capturePhase);
      if (!listeners) {
        if (node.scopeType === 'sibling' && node.parent) {
          traverseNode(node.parent, elem.parentElement!, capturePhase);
        } else {
          return;
        }
      }

      const traverse = (elem: Element) => {
        if (ev.propagationStopped) {
          return;
        }
        if (!capturePhase) {
          this.doBubbleStep(ev, elem, node.rootElement!, listeners);
          if (ev.propagationStopped) {
            return;
          }
        }

        if (capturePhase && node.scopeType === 'sibling' && node.parent) {
          traverseNode(node.parent, elem.parentElement!, capturePhase);
        }
        if (elem !== node.rootElement) {
          traverse(elem.parentElement!);
        }
        if (!capturePhase && node.scopeType === 'sibling' && node.parent) {
          traverseNode(node.parent, elem.parentElement!, capturePhase);
        }

        if (capturePhase) {
          this.doBubbleStep(ev, elem, node.rootElement!, listeners);
        }
      };

      traverse(elem);
    };

    traverseNode(tree, ev.target as Element, true);
    traverseNode(tree, ev.target as Element, false);
  }

  private doBubbleStep(
    ev: Event,
    elem: Element,
    rootElem: Element,
    listeners: Map<string, ID> | undefined
  ): void {
    for (const [selector, id] of listeners?.entries() ?? []) {
      if (selector === '') {
        if (elem === rootElem) {
          this.subject(1, patchEvent(ev, id, elem));
        }
      } else if (elem.matches(selector)) {
        this.subject(1, patchEvent(ev, id, elem));
      }
    }
  }
}

function patchStopPropagation(event: Event): PatchedEvent {
  const oldFn = event.stopPropagation;
  (event as any).propagtionStopped = false;
  event.stopPropagation = function stopPropagation() {
    oldFn.call(this);
    (this as any).propagationStopped = true;
  };
  return event as any;
}

function patchEvent(
  event: any,
  id: ID,
  currentTarget: Element | Document
): DomEvent {
  try {
    Object.defineProperty(event, 'currentTarget', {
      value: currentTarget,
      configurable: true,
    });
  } catch (err) {
    console.log('please use event.ownerTarget');
  }
  event.ownerTarget = currentTarget;
  event._cycleId = id;
  return event;
}

function setDeep<T, U, V>(
  map: Map<T, Map<U, V>>,
  t: T,
  u: U,
  v: V,
  onNew?: () => void
): void {
  let inner = map.get(t);
  if (!inner) {
    inner = new Map<U, V>();
    map.set(t, inner);
  }
  let value = inner.get(u);
  if (!value) {
    inner.set(u, v);
    onNew?.();
  }
}
