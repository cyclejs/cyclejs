import xs, {Stream} from 'xstream';
import {ScopeChecker} from './ScopeChecker';
import {IsolateModule} from './IsolateModule';
import {getFullScope, getSelectors} from './utils';
import {matchesSelector} from './matchesSelector';
declare var requestIdleCallback: any;

interface Destination {
  id: number;
  selector: string;
  scopeChecker: ScopeChecker;
  subject: Stream<Event>;
}

export interface CycleDOMEvent extends Event {
  propagationHasBeenStopped?: boolean;
  ownerTarget?: Element;
}

/**
 * Finds (with binary search) index of the destination that id equal to searchId
 * among the destinations in the given array.
 */
function indexOf(arr: Array<Destination>, searchId: number): number {
  let minIndex = 0;
  let maxIndex = arr.length - 1;
  let currentIndex: number;
  let current: Destination;

  while (minIndex <= maxIndex) {
    currentIndex = ((minIndex + maxIndex) / 2) | 0; // tslint:disable-line:no-bitwise
    current = arr[currentIndex];
    const currentId = current.id;
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
 * Manages "Event delegation", by connecting an origin with multiple
 * destinations.
 *
 * Attaches a DOM event listener to the DOM element called the "origin",
 * and delegates events to "destinations", which are subjects as outputs
 * for the DOMSource. Simulates bubbling or capturing, with regards to
 * isolation boundaries too.
 */
export class EventDelegator {
  private destinations: Array<Destination> = [];
  private listener: EventListener;
  private _lastId = 0;

  constructor(
    private origin: Element,
    public eventType: string,
    public useCapture: boolean,
    public isolateModule: IsolateModule,
    public preventDefault = false,
  ) {
    if (preventDefault) {
      if (useCapture) {
        this.listener = (ev: Event) => {
          ev.preventDefault();
          this.capture(ev);
        };
      } else {
        this.listener = (ev: Event) => {
          ev.preventDefault();
          this.bubble(ev);
        };
      }
    } else {
      if (useCapture) {
        this.listener = (ev: Event) => this.capture(ev);
      } else {
        this.listener = (ev: Event) => this.bubble(ev);
      }
    }
    origin.addEventListener(eventType, this.listener, useCapture);
  }

  public updateOrigin(newOrigin: Element) {
    this.origin.removeEventListener(
      this.eventType,
      this.listener,
      this.useCapture,
    );
    newOrigin.addEventListener(this.eventType, this.listener, this.useCapture);
    this.origin = newOrigin;
  }

  /**
   * Creates a *new* destination given the namespace and returns the subject
   * representing the destination of events. Is not referentially transparent,
   * will always return a different output for the same input.
   */
  public createDestination(namespace: Array<string>): Stream<Event> {
    const id = this._lastId++;
    const selector = getSelectors(namespace);
    const scopeChecker = new ScopeChecker(
      getFullScope(namespace),
      this.isolateModule,
    );
    const subject = xs.create<Event>({
      start: () => {},
      stop: () => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            this.removeDestination(id);
          });
        } else {
          this.removeDestination(id);
        }
      },
    });
    const destination: Destination = {id, selector, scopeChecker, subject};
    this.destinations.push(destination);
    return subject;
  }

  /**
   * Removes the destination that has the given id.
   */
  private removeDestination(id: number): void {
    const i = indexOf(this.destinations, id);
    i >= 0 && this.destinations.splice(i, 1); // tslint:disable-line:no-unused-expression
  }

  private capture(ev: Event) {
    const n = this.destinations.length;
    for (let i = 0; i < n; i++) {
      const dest = this.destinations[i];
      if (matchesSelector(ev.target as Element, dest.selector)) {
        dest.subject._n(ev);
      }
    }
  }

  private bubble(rawEvent: Event): void {
    const origin = this.origin;
    if (!origin.contains(rawEvent.currentTarget as Node)) {
      return;
    }
    const roof = origin.parentElement;
    const ev = this.patchEvent(rawEvent);
    for (
      let el = ev.target as Element | null;
      el && el !== roof;
      el = el.parentElement
    ) {
      if (!origin.contains(el)) {
        ev.stopPropagation();
      }
      if (ev.propagationHasBeenStopped) {
        return;
      }
      this.matchEventAgainstDestinations(el, ev);
    }
  }

  private patchEvent(event: Event): CycleDOMEvent {
    const pEvent = event as CycleDOMEvent;
    pEvent.propagationHasBeenStopped = false;
    const oldStopPropagation = pEvent.stopPropagation;
    pEvent.stopPropagation = function stopPropagation() {
      oldStopPropagation.call(this);
      this.propagationHasBeenStopped = true;
    };
    return pEvent;
  }

  private matchEventAgainstDestinations(el: Element, ev: CycleDOMEvent) {
    const n = this.destinations.length;
    for (let i = 0; i < n; i++) {
      const dest = this.destinations[i];
      if (!dest.scopeChecker.isDirectlyInScope(el)) {
        continue;
      }
      if (matchesSelector(el, dest.selector)) {
        this.mutateEventCurrentTarget(ev, el);
        dest.subject._n(ev);
      }
    }
  }

  private mutateEventCurrentTarget(
    event: CycleDOMEvent,
    currentTargetElement: Element,
  ) {
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
