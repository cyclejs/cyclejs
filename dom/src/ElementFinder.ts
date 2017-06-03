import {ScopeChecker} from './ScopeChecker';
import {getFullScope, getSelectors} from './utils';
import {IsolateModule} from './IsolateModule';
import {matchesSelector} from './matchesSelector';

function toElArray(input: any): Array<Element> {
  return Array.prototype.slice.call(input) as Array<Element>;
}

export class ElementFinder {
  constructor(
    public namespace: Array<string>,
    public isolateModule: IsolateModule,
  ) {}

  public call(rootElement: Element): Element | Array<Element> {
    const namespace = this.namespace;
    const selector = getSelectors(namespace);
    if (!selector) {
      return rootElement;
    }

    const fullScope = getFullScope(namespace);
    const scopeChecker = new ScopeChecker(fullScope, this.isolateModule);

    const topNode = fullScope
      ? this.isolateModule.getElement(fullScope) || rootElement
      : rootElement;

    const topNodeMatchesSelector =
      !!fullScope && !!selector && matchesSelector(topNode, selector);

    return toElArray(topNode.querySelectorAll(selector))
      .filter(scopeChecker.isDirectlyInScope, scopeChecker)
      .concat(topNodeMatchesSelector ? [topNode] : []);
  }
}
