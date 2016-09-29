import {VNode} from './interfaces';
import {EventDelegator} from './EventDelegator';
let MapPolyfill: typeof Map = require('es6-map');

export class IsolateModule {

  private eventDelegators: Map<string, Array<EventDelegator>> =
    new MapPolyfill<string, Array<EventDelegator>>();

  constructor(private isolatedElements: Map<string, Element>) { }

  createModule() {
    const self = this;

    return {
      create(formerVNode: VNode, currentVNode: VNode) {
        const {element, formerScope, currentScope}: ElementAndScopes =
          self.extractElementAndScopes(formerVNode, currentVNode);
        self.setScope(currentScope, <Element>element);
        self.deleteScope(formerScope);
        self.updateElement(<Element>element, currentScope);
      },

      update(formerVNode: VNode, newVNode: VNode) {
        const {element, formerScope, currentScope}: ElementAndScopes =
          self.extractElementAndScopes(formerVNode, newVNode);
        if (currentScope !== formerScope) {
          self.deleteScope(formerScope);
          self.setScope(currentScope, <Element>element);
        }
        if (formerScope && !currentScope) {
          self.deleteScope(currentScope);
        }
      },

      remove(vNode: VNode, cb: Function) {
        self.resetVNode(vNode);
        cb();
      },

      destroy(vNode: VNode) {
        self.resetVNode(vNode);
      }
    };
  }

  private extractElementAndScopes(formerVNode: VNode,
                                  currentVNode: VNode): ElementAndScopes {
    const {data: formerVNodeData = {}} = formerVNode;
    const {elm: element, data: currentVNodeData = {}} = currentVNode;
    const DEFAULT_SCOPE = ``;
    const formerScope = formerVNodeData.isolate || DEFAULT_SCOPE;
    const currentScope = currentVNodeData.isolate || DEFAULT_SCOPE;

    return { element, formerScope, currentScope };
  }

  private updateElement(element: Element, scope: string) {
    if (!scope) { return; }
    const eventDelegators = this.eventDelegators.get(scope);
    if (!eventDelegators) { return; }
    for (let i = 0, count = eventDelegators.length; i < count; ++i) {
      eventDelegators[i].updateTopElement(element);
    }
  }

  private setScope(scope: string, element: Element): void {
    if (!(scope && element)) { return; }
    this.isolatedElements.set(scope, element);
  }

  private deleteScope(scope: string): void {
    if (!scope) { return; }
    this.isolatedElements.delete(scope);
  }

  private resetVNode({elm: element, data = {}}: VNode): void {
    const scope = (<any>data).isolate;
    const isCurrentElement = this.isolatedElements.get(scope) === element;
    if (isCurrentElement) {
      this.deleteScope(scope);
    }
    const shouldResetEventDelegatorsInScope =
      !!(scope && isCurrentElement && this.eventDelegators.get(scope));
    if (shouldResetEventDelegatorsInScope) {
      this.eventDelegators.set(scope, []);
    }
  }

  isolatedElementInScope(scope: string): Element {
    return this.isolatedElements.get(scope);
  }

  scopeOfIsolatedElement(subject: Element): string | boolean {
    if (!subject) { return false; }
    const iterator: Iterator<[string, Element]> = this.isolatedElements.entries();
    for (let item: IteratorResult<[string, Element]> = iterator.next();
         !!item.value;
         item = iterator.next()) {
      const [scope, element] = item.value;
      if (subject === element) { return scope; }
    }

    return false;
  }

  appendEventDelegator(scope: string, eventDelegator: EventDelegator): void {
    let eventDelegators = this.eventDelegators.get(scope) || [];
    this.eventDelegators.set(scope, eventDelegators);
    eventDelegators[eventDelegators.length] = eventDelegator;
  }

  reset() {
    this.isolatedElements.clear();
  }
}

type ElementAndScopes = {
  element: Element | Text;
  formerScope: string;
  currentScope: string;
}
