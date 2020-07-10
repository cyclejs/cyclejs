import {VNode} from 'snabbdom/vnode';
import {EventDelegator} from './EventDelegator';
import {Scope} from './isolate';
import {isEqualNamespace} from './utils';
import SymbolTree from './SymbolTree';

export class IsolateModule {
  private namespaceTree = new SymbolTree<Element, Scope>(x => x.scope);
  private namespaceByElement: Map<Element, Array<Scope>>;
  private eventDelegator: EventDelegator | undefined;

  /**
   * A registry that keeps track of all the nodes that are removed from
   * the virtual DOM in a single patch. Those nodes are cleaned once snabbdom
   * has finished patching the DOM.
   */
  private vnodesBeingRemoved: Array<VNode>;

  constructor() {
    this.namespaceByElement = new Map<Element, Array<Scope>>();
    this.vnodesBeingRemoved = [];
  }

  public setEventDelegator(del: EventDelegator): void {
    this.eventDelegator = del;
  }

  private insertElement(namespace: Array<Scope>, el: Element): void {
    this.namespaceByElement.set(el, namespace);
    this.namespaceTree.set(namespace, el);
  }

  private removeElement(elm: Element): void {
    this.namespaceByElement.delete(elm);
    const namespace = this.getNamespace(elm);
    if (namespace) {
      this.namespaceTree.delete(namespace);
    }
  }

  public getElement(
    namespace: Array<Scope>,
    max?: number
  ): Element | undefined {
    return this.namespaceTree.get(namespace, undefined, max);
  }

  public getRootElement(elm: Element): Element | undefined {
    if (this.namespaceByElement.has(elm)) {
      return elm;
    }

    //TODO: Add quick-lru or similar as additional O(1) cache

    let curr = elm;
    while (!this.namespaceByElement.has(curr)) {
      curr = curr.parentNode as Element;
      if (!curr) {
        return undefined;
      } else if (curr.tagName === 'HTML') {
        throw new Error('No root element found, this should not happen at all');
      }
    }
    return curr;
  }

  public getNamespace(elm: Element): Array<Scope> | undefined {
    const rootElement = this.getRootElement(elm);
    if (!rootElement) {
      return undefined;
    }
    return this.namespaceByElement.get(rootElement) as Array<Scope>;
  }

  public createModule() {
    const self = this;
    return {
      create(emptyVNode: VNode, vNode: VNode) {
        const {elm, data = {}} = vNode;
        const namespace: Array<Scope> = (data as any).isolate;

        if (Array.isArray(namespace)) {
          self.insertElement(namespace, elm as Element);
        }
      },

      update(oldVNode: VNode, vNode: VNode) {
        const {elm: oldElm, data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldNamespace: Array<Scope> = (oldData as any).isolate;
        const namespace: Array<Scope> = (data as any).isolate;

        if (!isEqualNamespace(oldNamespace, namespace)) {
          if (Array.isArray(oldNamespace)) {
            self.removeElement(oldElm as Element);
          }
        }
        if (Array.isArray(namespace)) {
          self.insertElement(namespace, elm as Element);
        }
      },

      destroy(vNode: VNode) {
        self.vnodesBeingRemoved.push(vNode);
      },

      remove(vNode: VNode, cb: Function) {
        self.vnodesBeingRemoved.push(vNode);
        cb();
      },

      post() {
        const vnodesBeingRemoved = self.vnodesBeingRemoved;
        for (let i = vnodesBeingRemoved.length - 1; i >= 0; i--) {
          const vnode = vnodesBeingRemoved[i];
          const namespace =
            vnode.data !== undefined
              ? (vnode.data as any).isolation
              : undefined;
          if (namespace !== undefined) {
            self.removeElement(namespace);
          }
          (self.eventDelegator as EventDelegator).removeElement(
            vnode.elm as Element,
            namespace
          );
        }
        self.vnodesBeingRemoved = [];
      },
    };
  }
}
