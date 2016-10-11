import {Stream} from 'xstream';
import {ScopeChecker} from './ScopeChecker';
import {IsolateModule} from './IsolateModule';
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

let gDestinationId: number = 0;

interface Destination {
  subject: Stream<Event>;
  scopeChecker: ScopeChecker;
  selector: string;
  destinationId: number;
}

export interface CycleDOMEvent extends Event {
  propagationHasBeenStopped?: boolean;
  ownerTarget?: Element;
}

function findDestinationId(arr: Array<Destination>, searchId: number): number {

    let minIndex = 0;
    let maxIndex = arr.length - 1;
    let currentIndex: number;
    let currentElement: Destination;

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = arr[currentIndex];
        let currentId: number = currentElement.destinationId;
        if (currentId < searchId) {
            minIndex = currentIndex + 1;
        } else if (currentId > searchId) {
            maxIndex = currentIndex - 1;
        } else {
            return currentIndex;
        }
    }

    return -1;
}

/**
 * Attaches an actual event listener to the DOM root element,
 * handles "destinations" (interested DOMSource output subjects), and bubbling.
 */
export class EventDelegator {
  private destinations: Array<Destination> = [];
  private roof: Element;
  private domListener: EventListener;

  constructor(private topElement: Element,
              public eventType: string,
              public useCapture: boolean,
              public isolateModule: IsolateModule) {
    this.roof = topElement.parentElement;
    if (useCapture) {
      this.domListener = (ev: Event) => this.capture(ev);
    } else {
      this.domListener = (ev: Event) => this.bubble(ev);
    }
    topElement.addEventListener(eventType, this.domListener, useCapture);
  }

  bubble(rawEvent: Event): void {
    if (!document.body.contains(<Node> rawEvent.currentTarget)) {
      return;
    }
    const ev = this.patchEvent(rawEvent);
    for (let el = <Element> ev.target; el && el !== this.roof; el = el.parentElement) {
      if (!document.body.contains(el)) {
        ev.stopPropagation();
      }
      if (ev.propagationHasBeenStopped) {
        return;
      }
      this.matchEventAgainstDestinations(el, ev);
    }
  }

  matchEventAgainstDestinations(el: Element, ev: CycleDOMEvent) {
    for (let i = 0, n = this.destinations.length; i < n; i++) {
      const dest = this.destinations[i];
      if (!dest.scopeChecker.isStrictlyInRootScope(el)) {
        continue;
      }
      if (matchesSelector(el, dest.selector)) {
        this.mutateEventCurrentTarget(ev, el);
        dest.subject._n(ev);
      }
    }
  }

  capture(ev: Event) {
    for (let i = 0, n = this.destinations.length; i < n; i++) {
      const dest = this.destinations[i];
      if (matchesSelector((<Element> ev.target), dest.selector)) {
        dest.subject._n(ev);
      }
    }
  }

  addDestination(subject: Stream<Event>, namespace: Array<string>, destinationId: number) {
    const scope = getScope(namespace);
    const selector = getSelectors(namespace);
    const scopeChecker = new ScopeChecker(scope, this.isolateModule);
    this.destinations.push({subject, scopeChecker, selector, destinationId});
  }

  createDestinationId(): number {
    return gDestinationId++;
  }

  removeDestinationId(destinationId: number) {
    const i = findDestinationId(this.destinations, destinationId);
    if (i >= 0) {
      this.destinations.splice(i, 1);
    }
  }

  patchEvent(event: Event): CycleDOMEvent {
    const pEvent: CycleDOMEvent = <CycleDOMEvent> event;
    pEvent.propagationHasBeenStopped = false;
    const oldStopPropagation = pEvent.stopPropagation;
    pEvent.stopPropagation = function stopPropagation() {
      oldStopPropagation.call(this);
      this.propagationHasBeenStopped = true;
    };
    return pEvent;
  }

  mutateEventCurrentTarget(event: CycleDOMEvent, currentTargetElement: Element) {
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

  updateTopElement(newTopElement: Element) {
    this.topElement.removeEventListener(
      this.eventType, this.domListener, this.useCapture
    );
    newTopElement.addEventListener(
      this.eventType, this.domListener, this.useCapture
    );
    this.topElement = newTopElement;
  }
}
