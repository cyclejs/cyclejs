import {IsolateModule} from './IsolateModule';

export class ScopeChecker {
  constructor(private scope: string,
              private isolateModule: IsolateModule) {
  }

  public isStrictlyInRootScope(leaf: Element): boolean {
    for (let element = leaf; element; element = element.parentElement) {
      const scope: string | boolean = this.isolateModule.scopeOfIsolatedElement(element);
      const isNotThisScope: boolean = scope && scope !== this.scope;
      if (isNotThisScope) {
        return false;
      }
      if (!!scope) {
        return true;
      }
    }

    return true;
  }
}
