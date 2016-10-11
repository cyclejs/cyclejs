import {ScopeChecker} from './ScopeChecker';
import {getScope, getSelectors} from './utils';
import {IsolateModule} from './IsolateModule';

export class ElementFinder {
  constructor(public namespace: Array<string>,
              public isolateModule: IsolateModule) {
  }

  find(rootElement: Element): Element | Array<Element> {
    const namespace = this.namespace;
    const isNamespaceEmpty = namespace.join(``) === ``;

    return isNamespaceEmpty ?
      rootElement :
      findElements(namespace, rootElement, this.isolateModule);
  }
}

interface MatchesSelector {
  (element: Element, selector: string): boolean;
}

let matchesSelector: MatchesSelector;
declare var require: any;
try {
  matchesSelector = require(`matches-selector`);
} catch (e) {
  matchesSelector = <MatchesSelector>Function.prototype;
}

function findElements(
    namespace: Array<string>,
    rootElement: Element,
    isolateModule: IsolateModule): Array<Element> {
  const scope = getScope(namespace);
  const hasScope = scope.length > 0;
  const topElement = hasScope ?
    isolateModule.isolatedElementInScope(scope) || rootElement :
    rootElement;

  const selector = getSelectors(namespace);
  const elementMatchesSelector =
    hasScope && selector && matchesSelector(topElement, selector);
  const elementMatches = elementMatchesSelector ? [topElement] : [];
  const topElementNodeList = topElement.querySelectorAll(selector);

  const scopeChecker = new ScopeChecker(scope, isolateModule);

  return <Array<Element>>Array.prototype.slice.call(topElementNodeList)
    .filter(scopeChecker.isStrictlyInRootScope, scopeChecker)
    .concat(elementMatches);
}
