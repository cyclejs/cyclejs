import {VNode} from 'snabbdom';

export class IsolateModule {
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

  reset() {
    this.isolatedElements.clear();
  }

  createModule() {
    const self = this;
    return {
      create(oldVNode: VNode, vNode: VNode) {
        const {data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldIsolate = oldData.isolate || ``;
        const isolate = data.isolate || ``;
        if (isolate) {
          if (oldIsolate) { self.removeScope(oldIsolate); }
          self.setScope(elm, isolate);
        }
        if (oldIsolate && !isolate) {
          self.removeScope(isolate);
        }
      },

      update(oldVNode: VNode, vNode: VNode) {
        const {data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldIsolate = oldData.isolate || ``;
        const isolate = data.isolate || ``;
        if (isolate) {
          if (oldIsolate) { self.removeScope(oldIsolate); }
          self.setScope(elm, isolate);
        }
        if (oldIsolate && !isolate) {
          self.removeScope(isolate);
        }
      },

      remove({data = {}}, cb: Function) {
        if ((<any> data).isolate) {
          self.removeScope((<any> data).isolate);
        }
        cb();
      },

      destroy({data = {}}) {
        if ((<any> data).isolate) {
          self.removeScope((<any> data).isolate);
        }
      }
    };
  }

  // snabbdom module stuff
}
