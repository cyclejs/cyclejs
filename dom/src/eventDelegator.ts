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
          //this.namespaceTree.setRootNode(elem);
        }
      })
    );
  }

  public addEventListener(cmd: AddEventListenerCommand): void {
    //TODO: Handle non-bubbling event listeners

    const listener = (ev: Event) => {
      this.onEvent(ev, cmd.options?.capture ?? false);
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
        //TODO: Add listeners to queue
      }
    }

    this.namespaceTree.insertVirtualListener(cmd);
  }

  public removeEventListener(cmd: RemoveEventListenerCommand): void {
    //TODO: Implement this
  }

  private onEvent(ev: Event, capture: boolean): void {
    const tree = this.namespaceTree.getNamespaceRoot(ev.target as Element);

    const traverseNode = (node: TreeNode, elem: Element) => {
      const listeners = node.getListeners(capture);

      const traverse = (elem: Element) => {
        for (const [selector, id] of listeners?.entries() ?? []) {
          if (elem.matches(selector)) {
            this.subject(1, patchEvent(ev, id, elem));
          }
        }

        /*if (elem !== node.rootElement) {
          traverse(elem.parentNode! as Element);
        } else if (node.scopeType === 'sibling' && node.parent) {
          traverseNode(node.parent, elem.parentNode! as Element);
        }*/
      };

      traverse(elem);
    };

    traverseNode(tree, ev.target as Element);
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
