import {ScopeChecker} from './ScopeChecker';

function getScope(namespace: Array<string>): Array<string> {
  return namespace.filter(c => c.indexOf(`.cycle-scope`) > -1);
}

function removeDuplicates<T>(arr: Array<T>): Array<T> {
  const newArray: Array<T> = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (newArray.indexOf(arr[i]) === -1) {
      newArray.push(arr[i]);
    }
  }
  return newArray;
}

function toElArray(input: any): Array<Element> {
  return <Array<Element>> Array.prototype.slice.call(input);
}

export class ElementFinder {
  constructor(public namespace: Array<string>) {
  }

  call(rootElement: Element): Element | Array<Element> {
    const namespace = this.namespace;
    if (namespace.join(``) === ``) {
      return rootElement;
    }
    const scopeChecker = new ScopeChecker(namespace);
    const scope = getScope(namespace);
    // Uses global selector && is isolated
    if (namespace.indexOf(`*`) > -1 && scope.length > 0) {
      // grab top-level boundary of scope
      const topNode = rootElement.querySelector(scope.join(` `));
      // grab all children
      const childNodes = topNode.getElementsByTagName(`*`);
      return removeDuplicates([topNode].concat(toElArray(childNodes)))
        .filter(scopeChecker.isStrictlyInRootScope, scopeChecker);
    }

    return removeDuplicates(
      toElArray(rootElement.querySelectorAll(namespace.join(' ')))
        .concat(toElArray(rootElement.querySelectorAll(namespace.join(''))))
    ).filter(scopeChecker.isStrictlyInRootScope, scopeChecker);
  }
}
