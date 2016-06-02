import {VNode} from './interfaces';
import {EventDelegator} from './EventDelegator';

export class IsolateModule {
  private eventDelegators = new Map<string, Array<EventDelegator>>();
  constructor (private isolatedElements: Map<string, Element>) {
  }

  private setScope(elm: Element, scope: string) {
    this.isolatedElements.set(scope, elm);
  }

  private removeScope(scope: string) {
    this.isolatedElements.delete(scope);
  }

  getIsolatedElement(scope: string) {
    return this.isolatedElements.get(scope);
  }

  isIsolatedElement(elm: Element): string | boolean {
    const elements = Array.from(this.isolatedElements.entries());
    for (let i = 0; i < elements.length; ++i) {
      if (elm === elements[i][1]) {
        return elements[i][0];
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
        if (scope) {
          if (oldScope) { self.removeScope(oldScope); }
          self.setScope(<Element> elm, scope);
        }
        if (oldScope && !scope) {
          self.removeScope(scope);
        }
      },

      remove({data}: VNode, cb: Function) {
        data = data || {};
        const scope = (<any> data).isolate;
        if (scope) {
          self.removeScope(scope);
          if (self.eventDelegators.get(scope)) {
            self.eventDelegators.set(scope, []);
          }
        }
        cb();
      },

      destroy({data}: VNode) {
        data = data || {};
        const scope = (<any> data).isolate;
        if (scope) {
          self.removeScope(scope);
          if (self.eventDelegators.get(scope)) {
            self.eventDelegators.set(scope, []);
          }
        }
      }
    };
  }

  // snabbdom module stuff
}
