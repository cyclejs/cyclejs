export class ScopeChecker {
  constructor(private namespace: Array<string>) {
  }

  private someClassIsDomestic(classList: Array<string>): boolean {
    for (let i = classList.length - 1; i >= 0; i--) {
      const c = classList[i];
      const matched = c.match(/cycle-scope-(\S+)/);
      const classIsInNamespace = this.namespace.indexOf(`.${c}`) !== -1;
      if (matched && classIsInNamespace) {
        return true;
      }
    }
    return false;
  }

  private someClassIsForeign(classList: Array<string>): boolean {
    for (let i = classList.length - 1; i >= 0; i--) {
      const c = classList[i];
      const matched = c.match(/cycle-scope-(\S+)/);
      const classIsNotInNamespace = this.namespace.indexOf(`.${c}`) === -1;
      if (matched && classIsNotInNamespace) {
        return true;
      }
    }
    return false;
  }

  public isStrictlyInRootScope(leaf: Element): boolean {
    for (let el = leaf; !!el; el = el.parentElement) {
      const classList = el.classList || String.prototype.split.call(el.className, ` `);
      if (this.someClassIsDomestic(classList)) {
        return true;
      }
      if (this.someClassIsForeign(classList)) {
        return false;
      }
    }
    return true;
  }
}
