import { Producer, Subject, pipe, subscribe } from '@cycle/callbags';
import {
  AddEventListenerCommand,
  RemoveEventListenerCommand,
  DomEvent,
} from './types';
import { NamespaceTree, TreeNode } from './namespaceTree';
import { ID } from '@cycle/run';

export class EventDelegator {
  private root: Element | DocumentFragment | undefined;
  private rootListeners = new Map<string, Map<boolean, (ev: Event) => void>>();
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

    const listener = (ev: Event) => {
      this.onEvent(ev);
    };

    let inner = this.rootListeners.get(cmd.type);
    if (!inner) {
      inner = new Map<boolean, (ev: Event) => void>();
      this.rootListeners.set(cmd.type, inner);
    }
    const capture = cmd.options?.capture ?? false;
    let fn = inner.get(capture);

    if (!fn) {
      inner.set(capture, listener);
      if (this.root) {
        this.root.addEventListener(cmd.type, listener);
      } else {
        this.listenersToAdd.push([cmd.type, listener]);
      }
    }

    this.namespaceTree.insertVirtualListener(cmd);
  }

  public removeEventListener(cmd: RemoveEventListenerCommand): void {
    //TODO: Implement this
  }

  private onEvent(ev: Event): void {
    const tree = this.namespaceTree.getNamespaceRoot(ev.target as Element);

    const traverseNode = (
      node: TreeNode,
      elem: Element,
      capturePhase: boolean
    ) => {
      const listeners = node.getListeners(capturePhase);
      if (!listeners) {
        if (node.scopeType === 'sibling' && node.parent) {
          traverseNode(node.parent, elem.parentElement!, capturePhase);
        } else {
          return;
        }
      }

      const traverse = (elem: Element) => {
        if (!capturePhase) {
          this.doBubbleStep(ev, elem, node.rootElement!, listeners);
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

function patchEvent(event: any, id: ID, currentTarget: Element): DomEvent {
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
