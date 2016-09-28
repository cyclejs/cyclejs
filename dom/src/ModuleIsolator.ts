import {VNode} from './interfaces';
import {EventDelegator} from './EventDelegator';
let MapPolyfill: typeof Map = require('es6-map');

export class ModuleIsolator {

  private eventDelegators = new MapPolyfill<string, Array<EventDelegator>>();

  constructor (private isolatedElements: Map<string, Element>) {}

  createModule() {
    const self = this;

    return {
      create(oldVNode: VNode, vNode: VNode) {
        const {element, oldScope, scope} = ModuleIsolator.extractElementAndScopesFromVNodes(oldVNode, vNode);
        const eventDelegators: Array<EventDelegator> = self.eventDelegators.get(scope);
        if (scope) { self.setScope(<Element> element, scope); }
        if (oldScope) { self.removeScope(oldScope); }
        if (scope && eventDelegators) {
          for (let i in eventDelegators) {
            eventDelegators[i].updateTopElement(<Element> element);
          }
          return;
        }
        const isScopeWithoutEventDelegators = scope && eventDelegators === void 0;
        if (isScopeWithoutEventDelegators) { self.eventDelegators.set(scope, []); }
      },

      update(oldVNode: VNode, vNode: VNode) {
        const {element, oldScope, scope} = ModuleIsolator.extractElementAndScopesFromVNodes(oldVNode, vNode);
        if (oldScope && scope && scope !== oldScope) { self.removeScope(oldScope); }
        if (scope && scope !== oldScope) { self.setScope(<Element> element, scope); }
        if (oldScope && !scope) { self.removeScope(scope); }
      },

      remove(vNode: VNode, cb: Function) {
        self.cleanUpVNode(vNode);
        cb();
      },

      destroy(vNode: VNode) {
        self.cleanUpVNode(vNode);
      }
    };
  }

  static extractElementAndScopesFromVNodes(oldVNode: VNode, vNode: VNode) {
    const {data: oldData = {}} = oldVNode;
    const {elm: element, data = {}} = vNode;
    const oldScope: string = oldData.isolate || ``;
    const scope: string = data.isolate || ``;

    return {element, oldScope, scope};
  }

  private setScope(elm: Element, scope: string) {
    this.isolatedElements.set(scope, elm);
  }

  private removeScope(scope: string) {
    this.isolatedElements.delete(scope);
  }

  private cleanUpVNode({elm: element, data = {}}: VNode) {
    const scope = (<any> data).isolate;
    const isCurrentElement = this.isolatedElements.get(scope) === element;
    const isScopeAndCurrentElement = scope && isCurrentElement;
    if (isScopeAndCurrentElement) {
      this.removeScope(scope);
    }
    if (isScopeAndCurrentElement && this.eventDelegators.get(scope)) {
      this.eventDelegators.set(scope, []);
    }
  }

  getIsolatedElement(scope: string) {
    return this.isolatedElements.get(scope);
  }

  isIsolatedElement(subject: Element): string | boolean {
    const iterator = this.isolatedElements.entries();
    for (let result = iterator.next(); !!result.value; result = iterator.next()) {
      const [scope, element] = result.value;
      if (subject === element) { return scope; }
    }

    return false;
  }

  addEventDelegator(scope: string, eventDelegator: EventDelegator) {
    let eventDelegators = this.eventDelegators.get(scope);
    if (!eventDelegators) {
      eventDelegators = [];
      this.eventDelegators.set(scope, eventDelegators);
    }
    eventDelegators[eventDelegators.length] = eventDelegator;
  }

  reset() {
    this.isolatedElements.clear();
  }
}
