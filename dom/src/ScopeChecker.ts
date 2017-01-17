import {IsolateModule} from './IsolateModule';

export class ScopeChecker {
  constructor(private fullScope: string,
              private isolateModule: IsolateModule) {
  }

  /**
   * Checks whether the given element is *directly* in the scope of this
   * scope checker. Being contained *indirectly* through other scopes
   * is not valid. This is crucial for implementing parent-child isolation,
   * so that the parent selectors don't search inside a child scope.
   */
  public isDirectlyInScope(leaf: Element): boolean {
    for (let el: Element | null = leaf; el; el = el.parentElement) {
      const fullScope = this.isolateModule.getFullScope(el);
      if (fullScope && fullScope !== this.fullScope) {
        return false;
      }
      if (fullScope) {
        return true;
      }
    }
    return true;
  }
}
