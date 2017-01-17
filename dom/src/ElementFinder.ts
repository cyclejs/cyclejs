import {ScopeChecker} from './ScopeChecker';
import {getFullScope, getSelectors} from './utils';
import {IsolateModule} from './IsolateModule';

interface MatchesSelector {
  (element: Element, selector: string): boolean;
}
let matchesSelector: MatchesSelector;
declare var require: any;
try {
  matchesSelector = require(`matches-selector`);
} catch (e) {
  matchesSelector = Function.prototype as MatchesSelector;
}

function toElArray(input: any): Array<Element> {
  return Array.prototype.slice.call(input) as Array<Element>;
}

export class ElementFinder {
  constructor(public namespace: Array<string>,
              public isolateModule: IsolateModule) {
  }

  public call(rootElement: Element): Element | Array<Element> {
    const namespace = this.namespace;
    if (namespace.join('') === '') {
      return rootElement;
    }

    const selector = getSelectors(namespace);
    const fullScope = getFullScope(namespace);
    const scopeChecker = new ScopeChecker(fullScope, this.isolateModule);

    const topNode = fullScope ?
      this.isolateModule.getElement(fullScope) || rootElement :
      rootElement;

    const topNodeMatchesSelector =
      !!fullScope && !!selector && matchesSelector(topNode, selector);

    return toElArray(topNode.querySelectorAll(selector))
      .filter(scopeChecker.isDirectlyInScope, scopeChecker)
      .concat(topNodeMatchesSelector ? [topNode] : []);
  }
}
