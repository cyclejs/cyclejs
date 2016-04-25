import {ScopeChecker} from './ScopeChecker';
import {IsolateModule} from './isolateModule';
import {getScope, getSelectors} from './utils';

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

export interface PatchedEvent extends Event {
  propagationHasBeenStopped?: boolean;
  ownerTarget?: Element;
}

export class BubblingSimulator {
  private scope: string;
  private selector: string;
  private roof: HTMLElement;
  private scopeChecker: ScopeChecker;

  constructor(private namespace: Array<string>,
              private rootEl: Element,
              isolateModule: IsolateModule) {
    this.scope = getScope(namespace);
    this.selector = getSelectors(namespace);
    this.roof = rootEl.parentElement;
    this.scopeChecker = new ScopeChecker(this.scope, isolateModule);
  }

  shouldPropagate(ev: PatchedEvent): boolean {
    this.maybeMutateEventPropagationAttributes(ev);
    if (ev.propagationHasBeenStopped) {
      return false;
    }
    for (let el = <Element> ev.target; el && el !== this.roof; el = el.parentElement) {
      if (!this.scopeChecker.isStrictlyInRootScope(el)) {
        continue;
      }
      if (matchesSelector(el, this.selector)) {
        this.mutateEventCurrentTarget(ev, el);
        return true;
      }
    }
    return false;
  }

  maybeMutateEventPropagationAttributes(event: PatchedEvent): void {
    if (!event.hasOwnProperty(`propagationHasBeenStopped`)) {
      event.propagationHasBeenStopped = false;
      const oldStopPropagation = event.stopPropagation;
      event.stopPropagation = function stopPropagation() {
        oldStopPropagation.call(this);
        this.propagationHasBeenStopped = true;
      };
    }
  }

  mutateEventCurrentTarget(event: PatchedEvent, currentTargetElement: Element) {
    try {
      Object.defineProperty(event, `currentTarget`, {
        value: currentTargetElement,
        configurable: true,
      });
    } catch (err) {
      console.log(`please use event.ownerTarget`);
    }
    event.ownerTarget = currentTargetElement;
  }
}
