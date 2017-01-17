import {VNode} from 'snabbdom/vnode';
import {EventDelegator} from './EventDelegator';
let MapPolyfill: typeof Map = require('es6-map');

export class IsolateModule {
  private elementsByFullScope: Map<string, Element>;

  /**
   * A Map where keys are full scope strings and values are many delegators
   * for that scope. The only reason why this data structure is here is to
   * be able to update the origin element inside those delegators.
   * The delegators are never created in this class.
   */
  private delegatorsByFullScope: Map<string, Array<EventDelegator>>;

  /**
   * A registry of full scopes representing scopes that are currently
   * being updated in delegators or elements. This is useful to avoid
   * cleaning up data structures for an element that is being *replaced*,
   * not *removed* in the virtual DOM.
   */
  private fullScopesBeingUpdated: Array<string>;

  constructor () {
    this.elementsByFullScope = new MapPolyfill<string, Element>();
    this.delegatorsByFullScope = new MapPolyfill<string, Array<EventDelegator>>();
    this.fullScopesBeingUpdated = [];
  }

  private addElement(fullScope: string, elm: Element) {
    this.elementsByFullScope.set(fullScope, elm);
  }

  private removeElement(fullScope: string) {
    this.elementsByFullScope.delete(fullScope);
  }

  private cleanupVNode({data, elm}: VNode) {
    const fullScope = (data || {} as any).isolate || '';
    const isCurrentElm = this.elementsByFullScope.get(fullScope) === elm;
    const isScopeBeingUpdated = this.fullScopesBeingUpdated.indexOf(fullScope) >= 0;
    if (fullScope && isCurrentElm && !isScopeBeingUpdated) {
      this.removeElement(fullScope);
      this.removeEventDelegators(fullScope);
    }
  }

  public getElement(fullScope: string): Element | undefined {
    return this.elementsByFullScope.get(fullScope);
  }

  public getFullScope(elm: Element): string {
    let iterator = this.elementsByFullScope.entries();
    for (let result = iterator.next(); !!result.value; result = iterator.next()) {
      const [fullScope, element] = result.value;
      if (elm === element) {
        return fullScope;
      }
    }
    return '';
  }

  public addEventDelegator(fullScope: string, eventDelegator: EventDelegator) {
    let delegators = this.delegatorsByFullScope.get(fullScope);
    if (!delegators) {
      delegators = [];
      this.delegatorsByFullScope.set(fullScope, delegators);
    }
    delegators[delegators.length] = eventDelegator;
  }

  private removeEventDelegators(fullScope: string) {
    this.delegatorsByFullScope.delete(fullScope);
  }

  public reset() {
    this.elementsByFullScope.clear();
    this.delegatorsByFullScope.clear();
    this.fullScopesBeingUpdated = [];
  }

  public createModule() {
    const self = this;
    return {
      create(oldVNode: VNode, vNode: VNode) {
        const {data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldFullScope = (oldData as any).isolate || '';
        const fullScope = (data as any).isolate || '';

        // Update data structures with the newly-created element
        if (fullScope) {
          self.fullScopesBeingUpdated.push(fullScope);
          if (oldFullScope) { self.removeElement(oldFullScope); }
          self.addElement(fullScope, elm as Element);

          // Update delegators for this scope
          const delegators = self.delegatorsByFullScope.get(fullScope);
          if (delegators) {
            for (let i = 0, len = delegators.length; i < len; ++i) {
              delegators[i].updateOrigin(elm as Element);
            }
          }
        }
        if (oldFullScope && !fullScope) {
          self.removeElement(fullScope);
        }
      },

      update(oldVNode: VNode, vNode: VNode) {
        const {data: oldData = {}} = oldVNode;
        const {elm, data = {}} = vNode;
        const oldFullScope = (oldData as any).isolate || '';
        const fullScope = (data as any).isolate || '';

        // Same element, but different scope, so update the data structures
        if (fullScope && fullScope !== oldFullScope) {
          if (oldFullScope) { self.removeElement(oldFullScope); }
          self.addElement(fullScope, elm as Element);
          const delegators = self.delegatorsByFullScope.get(oldFullScope);
          self.removeEventDelegators(oldFullScope);
          self.delegatorsByFullScope.set(fullScope, delegators);
        }
        // Same element, but lost the scope, so update the data structures
        if (oldFullScope && !fullScope) {
          self.removeElement(oldFullScope);
          self.removeEventDelegators(oldFullScope);
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
        self.fullScopesBeingUpdated = [];
      },
    };
  }
}
