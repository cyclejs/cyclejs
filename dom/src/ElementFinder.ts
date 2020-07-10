import {ScopeChecker} from './ScopeChecker';
import {getSelectors} from './utils';
import {Scope} from './isolate';
import {IsolateModule} from './IsolateModule';

function toElArray(input: any): Array<Element> {
  return Array.prototype.slice.call(input) as Array<Element>;
}

export class ElementFinder {
  constructor(
    public namespace: Array<Scope>,
    public isolateModule: IsolateModule
  ) {}

  public call(): Array<Element> {
    const namespace = this.namespace;
    const selector = getSelectors(namespace);

    const scopeChecker = new ScopeChecker(namespace, this.isolateModule);
    const topNode = this.isolateModule.getElement(
      namespace.filter(n => n.type !== 'selector')
    );

    if (topNode === undefined) {
      return [];
    }

    if (selector === '') {
      return [topNode];
    }

    return toElArray(topNode.querySelectorAll(selector))
      .filter(scopeChecker.isDirectlyInScope, scopeChecker)
      .concat(topNode.matches(selector) ? [topNode] : []);
  }
}
