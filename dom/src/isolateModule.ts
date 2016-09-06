import {VNode} from './interfaces';
import {EventDelegator} from './EventDelegator';
let MapPolyfill: typeof Map = require('es6-map');

export class IsolateModule {
  private eventDelegators = new MapPolyfill<string, Array<EventDelegator>>();
  constructor (private isolatedElements: Map<string, Element>) {
  }

  private setScope(elm: Element, scope: string) {
    this.isolatedElements.set(scope, elm);
  }

  private removeScope(scope: string) {
    this.isolatedElements.delete(scope);
  }

  private cleanupVNode({data, elm}: VNode) {
    data = data || {};
    const scope = (<any> data).isolate;
    const isCurrentElm = this.isolatedElements.get(scope) === elm;
    if (scope && isCurrentElm) {
      this.removeScope(scope);
      if (this.eventDelegators.get(scope)) {
        this.eventDelegators.set(scope, []);
      }
    }
  }

  getIsolatedElement(scope: string) {
    return this.isolatedElements.get(scope);
  }

  isIsolatedElement(elm: Element): string | boolean {
    let iterator = this.isolatedElements.entries();
    for (let result = iterator.next(); !!result.value; result = iterator.next()) {
      const [scope, element] = result.value;
      if (elm === element) {
        return scope;
      }
    }
    return false;
  }

  addEventDelegator(scope: string, eventDelegator: EventDelegator) {
    let delegators = this.eventDelegators.get(scope);
    if (!delegators) {
      delegators = [];
      this.eventDelegators.set(scope, delegators);
    }
    delegators[delegators.length] = eventDelegator;
  }

  reset() {
    this.isolatedElements.clear();
  }

  createModule() {
    const self = this;
    return {
      create(oldVNode: VNode, vNode: VNode) {
        const {data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldScope = oldData.isolate || ``;
        const scope = data.isolate || ``;
        if (scope) {
          if (oldScope) { self.removeScope(oldScope); }
          self.setScope(<Element> elm, scope);
          const delegators = self.eventDelegators.get(scope);
          if (delegators) {
            for (let i = 0, len = delegators.length; i < len; ++i) {
              delegators[i].updateTopElement(<Element> elm);
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
        const oldScope = oldData.isolate || ``;
        const scope = data.isolate || ``;
        if (scope && scope !== oldScope) {
          if (oldScope) { self.removeScope(oldScope); }
          self.setScope(<Element> elm, scope);
        }
        if (oldScope && !scope) {
          self.removeScope(scope);
        }
      },

      remove(vNode: VNode, cb: Function) {
        self.cleanupVNode(vNode);
        cb();
      },

      destroy(vNode: VNode) {
        self.cleanupVNode(vNode);
      }
    };
  }

  // snabbdom module stuff
}
