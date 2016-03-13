import {ScopeChecker} from './ScopeChecker';

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
  private descendantSel: string;
  private topSel: string;
  private roof: HTMLElement;
  private scopeChecker: ScopeChecker;

  constructor(private namespace: Array<string>,
              private rootEl: Element) {
    this.descendantSel = namespace.join(` `);
    this.topSel = namespace.join(``);
    this.roof = rootEl.parentElement;
    this.scopeChecker = new ScopeChecker(namespace);
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
      if (matchesSelector(el, this.descendantSel) || matchesSelector(el, this.topSel)) {
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
