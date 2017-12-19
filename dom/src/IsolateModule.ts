import {VNode} from 'snabbdom/vnode';
import {EventDelegator} from './EventDelegator';
import {Scope} from './isolate';
import {isEqualNamespace} from './utils';

export interface NamespaceTree {
  [name: string]: Element | NamespaceTree;
}

const elmSymbol = Symbol('namespaceTree');

export class IsolateModule {
  private namespaceTree: NamespaceTree;
  private namespaceByElement: Map<Element, Array<Scope>>;
  private eventDelegator: EventDelegator;

  /**
   * A registry that keeps track of all the nodes that are removed from
   * the virtual DOM in a single patch. Those nodes are cleaned once snabbdom
   * has finished patching the DOM.
   */
  private vnodesBeingRemoved: Array<VNode>;

  constructor() {
    this.namespaceTree = {};
    this.namespaceByElement = new Map<Element, Array<Scope>>();
    this.vnodesBeingRemoved = [];
  }

  public getElement(namespace: Array<Scope>): Element | undefined {
    let curr = this.namespaceTree;
    for (let i = 0; i < namespace.length; i++) {
      const n = namespace[i];
      if (curr === undefined) {
        return undefined;
      }
      if (n.type === 'selector') {
        continue;
      }
      curr = curr[n.scope] as NamespaceTree;
    }
    return curr[elmSymbol] as Element;
  }

  public setEventDelegator(del: EventDelegator): void {
    this.eventDelegator = del;
  }

  private insertElement(namespace: Array<Scope>, el: Element): void {
    let curr = this.namespaceTree;
    for (let i = 0; i < namespace.length; i++) {
      if (curr[namespace[i].scope] === undefined) {
        curr[namespace[i].scope] = {};
      }
      curr = curr[namespace[i].scope] as NamespaceTree;
    }
    curr[elmSymbol] = el;
    this.namespaceByElement.set(el, namespace);
  }

  private removeElement(namespace: Array<Scope>): void {
    let curr = this.namespaceTree;
    for (let i = 0; i < namespace.length; i++) {
      curr = curr[namespace[i].scope] as NamespaceTree;
    }
    const elm = curr[elmSymbol] as Element;
    delete curr[elmSymbol];
    this.namespaceByElement.delete(elm);
  }

  public getNamespace(elm: Element): Array<Scope> {
    let curr = elm;
    while (true) {
      const namespace = this.namespaceByElement.get(curr);
      if (namespace !== undefined) {
        return namespace;
      }
      curr = curr.parentNode as Element;
      if (!curr) {
        throw new Error('No root element found, this should not happen at all');
      }
    }
  }

  public reset() {
    this.namespaceTree = {};
    const root: Element = this.namespaceTree[elmSymbol] as Element;
    this.namespaceByElement.clear();
    this.namespaceByElement.set(root, []);
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
        const {data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldNamespace: Array<Scope> = (oldData as any).isolate;
        const namespace: Array<Scope> = (data as any).isolate;

        if (!isEqualNamespace(oldNamespace, namespace)) {
          if (Array.isArray(oldNamespace)) {
            self.removeElement(oldNamespace);
          }
          if (Array.isArray(namespace)) {
            self.insertElement(namespace, elm as Element);
          }
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
          self.eventDelegator.removeElement(vnode.elm as Element, namespace);
        }
        self.vnodesBeingRemoved = [];
      },
    };
  }
}
