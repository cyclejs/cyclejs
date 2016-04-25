import {ScopeChecker} from './ScopeChecker';
import {getScope, getSelectors} from './utils';
import {IsolateModule} from './isolateModule';

interface MatchesSelector {
  (element: Element, selector: string): boolean;
}
let matchesSelector: MatchesSelector;
declare var require: any;
try {
  matchesSelector = require(`matches-selector`);
} catch (e) {
  matchesSelector = <MatchesSelector> Function.prototype;
}

function toElArray(input: any): Array<Element> {
  return <Array<Element>> Array.prototype.slice.call(input);
}

export class ElementFinder {
  constructor(public namespace: Array<string>,
              public isolateModule: IsolateModule) {
  }

  call(rootElement: Element): Element | Array<Element> {
    const namespace = this.namespace;
    if (namespace.join(``) === ``) {
      return rootElement;
    }

    const scope = getScope(namespace);
    const scopeChecker = new ScopeChecker(scope, this.isolateModule);
    const selector = getSelectors(namespace);
    let topNode = rootElement;
    let topNodeMatches: Array<Element> = [];

    if (scope.length > 0) {
      topNode = this.isolateModule.getIsolatedElement(scope) || rootElement;
      if (selector && matchesSelector(topNode, selector)) {
        topNodeMatches.push(topNode);
      }
    }

    return toElArray(topNode.querySelectorAll(selector))
      .filter(scopeChecker.isStrictlyInRootScope, scopeChecker)
      .concat(topNodeMatches);
  }
}
