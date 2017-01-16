import {VNode} from 'snabbdom/vnode';
import {EventDelegator} from './EventDelegator';
let MapPolyfill: typeof Map = require('es6-map');

export class IsolateModule {
  private isolatedElements: Map<string, Element>;
  private eventDelegators: Map<string, Array<EventDelegator>>;
  private scopesBeingUpdated: Array<string>;

  constructor () {
    this.isolatedElements = new MapPolyfill<string, Element>();
    this.eventDelegators = new MapPolyfill<string, Array<EventDelegator>>();
    this.scopesBeingUpdated = [];
  }

  private setScope(elm: Element, scope: string) {
    this.isolatedElements.set(scope, elm);
  }

  private removeScope(scope: string) {
    this.isolatedElements.delete(scope);
  }

  private cleanupVNode({data, elm}: VNode) {
    data = data || {};
    const scope = (data as any).isolate || '';
    const isCurrentElm = this.isolatedElements.get(scope) === elm;
    if (scope && isCurrentElm && this.scopesBeingUpdated.indexOf(scope) === -1) {
      this.removeScope(scope);
      if (this.eventDelegators.get(scope)) {
        this.eventDelegators.set(scope, []);
      }
    }
  }

  public getIsolatedElement(scope: string) {
    return this.isolatedElements.get(scope);
  }

  public isIsolatedElement(elm: Element): string | boolean {
    let iterator = this.isolatedElements.entries();
    for (let result = iterator.next(); !!result.value; result = iterator.next()) {
      const [scope, element] = result.value;
      if (elm === element) {
        return scope;
      }
    }
    return false;
  }

  public addEventDelegator(scope: string, eventDelegator: EventDelegator) {
    let delegators = this.eventDelegators.get(scope);
    if (!delegators) {
      delegators = [];
      this.eventDelegators.set(scope, delegators);
    }
    delegators[delegators.length] = eventDelegator;
  }

  public reset() {
    this.isolatedElements.clear();
    this.scopesBeingUpdated = [];
  }

  public createModule() {
    const self = this;
    return {
      create(oldVNode: VNode, vNode: VNode) {
        const {data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldScope = (oldData as any).isolate || ``;
        const scope = (data as any).isolate || ``;
        if (scope) {
          if (oldScope) { self.removeScope(oldScope); }
          self.scopesBeingUpdated.push(scope);
          self.setScope(elm as Element, scope);
          const delegators = self.eventDelegators.get(scope);
          if (delegators) {
            for (let i = 0, len = delegators.length; i < len; ++i) {
              delegators[i].updateTopElement(elm as Element);
            }
          } else if (delegators === void 0) {
            self.eventDelegators.set(scope, []);
          }
        }
        if (oldScope && !scope) {
          self.removeScope(scope);
        }
      },

      update(oldVNode: VNode, vNode: VNode) {
        const {data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldScope = (oldData as any).isolate || ``;
        const scope = (data as any).isolate || ``;
        if (scope && scope !== oldScope) {
          if (oldScope) { self.removeScope(oldScope); }
          self.setScope(elm as Element, scope);
        }
        if (oldScope && !scope) {
          self.removeScope(scope);
        }
      },

      destroy(vNode: VNode) {
        self.cleanupVNode(vNode);
      },

      remove(vNode: VNode, cb: Function) {
        self.cleanupVNode(vNode);
        cb();
      },

      post() {
        self.scopesBeingUpdated = [];
      },
    };
  }
}
