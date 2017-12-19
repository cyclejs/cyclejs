import xs, {Stream, Subscription} from 'xstream';
import {ScopeChecker} from './ScopeChecker';
import {IsolateModule} from './IsolateModule';
import {getSelectors, getTotalIsolatedScope, makeInsert} from './utils';
import {ElementFinder} from './ElementFinder';
import {EventsFnOptions} from './DOMSource';
import {Scope} from './isolate';
import {
  fromEvent,
  preventDefaultConditional,
  PreventDefaultOpt,
} from './fromEvent';
declare var requestIdleCallback: any;

interface Destination {
  useCapture: boolean;
  scopeChecker: ScopeChecker;
  subject: Stream<Event>;
  preventDefault?: PreventDefaultOpt;
  passive?: boolean;
}

export interface CycleDOMEvent extends Event {
  propagationHasBeenStopped: boolean;
  ownerTarget: Element;
}

interface ListenerTree {
  [scope: string]: Map<string, Destination[]> | ListenerTree;
}

const listenerSymbol = Symbol('listener');

export const eventTypesThatDontBubble = [
  `blur`,
  `canplay`,
  `canplaythrough`,
  `durationchange`,
  `emptied`,
  `ended`,
  `focus`,
  `load`,
  `loadeddata`,
  `loadedmetadata`,
  `mouseenter`,
  `mouseleave`,
  `pause`,
  `play`,
  `playing`,
  `ratechange`,
  `reset`,
  `scroll`,
  `seeked`,
  `seeking`,
  `stalled`,
  `submit`,
  `suspend`,
  `timeupdate`,
  `unload`,
  `volumechange`,
  `waiting`,
];

interface DOMListener {
  sub: Subscription;
  passive: boolean;
  virtualListeners: number;
}

interface NonBubblingListener {
  sub: Subscription | undefined;
  destination: Destination;
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
  private virtualListeners: ListenerTree;
  private origin: Element;

  private domListeners: Map<string, DOMListener>;
  private nonBubblingListeners: Map<string, Map<Element, NonBubblingListener>>;

  constructor(
    private rootElement$: Stream<Element>,
    public isolateModule: IsolateModule,
  ) {
    this.isolateModule.setEventDelegator(this);
    this.domListeners = new Map<string, DOMListener>();
    this.nonBubblingListeners = new Map<
      string,
      Map<Element, NonBubblingListener>
    >();
    this.virtualListeners = {};
    rootElement$.addListener({
      next: el => {
        if (this.origin !== el) {
          this.origin = el;
          this.resetEventListeners();
        }
        this.resetNonBubblingListeners();
      },
    });
  }

  public addEventListener(
    eventType: string,
    namespace: Array<Scope>,
    options: EventsFnOptions,
    bubbles?: boolean,
  ): Stream<Event> {
    const subject = xs.never();
    const scopeChecker = new ScopeChecker(namespace, this.isolateModule);

    const dest = this.insertListener(subject, scopeChecker, eventType, options);

    const shouldBubble =
      bubbles === undefined
        ? eventTypesThatDontBubble.indexOf(eventType) === -1
        : bubbles;
    if (shouldBubble) {
      if (!this.domListeners.has(eventType)) {
        this.setupDOMListener(eventType, !!options.passive);
      } else {
        const listener = this.domListeners.get(eventType) as DOMListener;
        this.domListeners.set(eventType, {
          ...listener,
          virtualListeners: listener.virtualListeners + 1,
        });
      }
    } else {
      const finder = new ElementFinder(namespace, this.isolateModule);
      this.setupNonBubblingListener(eventType, finder.call()[0], dest);
    }

    return subject;
  }

  public removeElement(element: Element, namespace?: Scope[]): void {
    if (namespace !== undefined) {
      this.removeVirtualListener(namespace);
    }
    const toRemove: [string, Element][] = [];
    this.nonBubblingListeners.forEach((map, type) => {
      if (map.has(element)) {
        toRemove.push([type, element]);
      }
    });
    for (let i = 0; i < toRemove.length; i++) {
      const map = this.nonBubblingListeners.get(toRemove[i][0]) as Map<
        Element,
        NonBubblingListener
      >;
      map.delete(toRemove[i][1]);
      if (map.size === 0) {
        this.nonBubblingListeners.delete(toRemove[i][0]);
      } else {
        this.nonBubblingListeners.set(toRemove[i][0], map);
      }
    }
  }

    if (!this.nonBubblingListeners.has(eventType)) {
      this.nonBubblingListeners.set(
        eventType,
        new Map<Element, NonBubblingListener>(),
      );
    }
    const map = this.nonBubblingListeners.get(eventType) as Map<
      Element,
      NonBubblingListener
    >;
    map.set(element, {sub, destination});
  }

  private resetEventListeners(): void {
    const iter = this.domListeners.entries();
    let curr = iter.next();
    while (!curr.done) {
      const [type, {sub, passive}] = curr.value;
      sub.unsubscribe();
      this.setupDOMListener(type, passive);
      curr = iter.next();
    }
  }

  private resetNonBubblingListeners(): void {
    const newMap = new Map<string, Map<Element, NonBubblingListener>>();
    const insert = makeInsert(newMap);

    this.nonBubblingListeners.forEach((map, type) => {
      map.forEach((value, elm) => {
        if (!document.body.contains(elm)) {
          const {sub, destination} = value;
          if (sub) {
            sub.unsubscribe();
          }
          const elementFinder = new ElementFinder(
            destination.scopeChecker.namespace,
            this.isolateModule,
          );
          const newElm = elementFinder.call()[0];
          const newSub = fromEvent(
            newElm,
            type,
            false,
            false,
            destination.passive,
          ).subscribe({
            next: event =>
              this.onEvent(type, event, !!destination.passive, false),
            error: () => {},
            complete: () => {},
          });
          insert(type, newElm, {sub: newSub, destination});
        } else {
          insert(type, elm, value);
        }
      });
      this.nonBubblingListeners = newMap;
    });
  }

  private buildPath(element: Element, namespace: Array<Scope>): Element[] {
    const totalNamespace = getTotalIsolatedScope(namespace);
    const root = this.isolateModule.getElement(totalNamespace);
    let curr = element;
    const result: Element[] = [element];
    do {
      curr = curr.parentNode as Element;
      result.push(curr);
    } while (curr && curr !== root);
    return result;
  }

  private onEvent(
    type: string,
    event: Event,
    passive: boolean,
    bubbles = true,
  ): void {
    const namespace = this.isolateModule.getNamespace(event.target as Element);
    const path = this.buildPath(event.target as Element, namespace);
    const cycleEvent = this.patchEvent(event);
    this.bubble(
      type,
      cycleEvent,
      true,
      path.slice(0).reverse(),
      namespace,
      passive,
      bubbles,
    );
    this.bubble(type, cycleEvent, false, path, namespace, passive, bubbles);
  }

  private bubble(
    type: string,
    event: CycleDOMEvent,
    useCapture: boolean,
    path: Element[],
    namespace: Array<Scope>,
    passive: boolean,
    bubbles: boolean,
  ): void {
    let n = namespace;
    do {
      const destinations = this.getVirtualListeners(type, n);
      const processed = new Set<Destination>();
      if (destinations !== undefined) {
        for (let i = 0; i < path.length; i++) {
          for (let j = 0; j < destinations.length; j++) {
            const d = destinations[j];
            if (event.propagationHasBeenStopped) {
              return;
            }
            if (
              !!d.useCapture !== useCapture ||
              processed.has(destinations[j]) ||
              !!d.passive !== passive
            ) {
              continue;
            }
            const currentEvent = this.mutateEventCurrentTarget(event, path[i]);
            const selector = getSelectors(d.scopeChecker.namespace);
            if (
              bubbles ||
              (!bubbles && useCapture && i === path.length - 1) ||
              (!bubbles && !useCapture && i === 0)
            ) {
              if ((selector && path[i].matches(selector)) || !selector) {
                if (d.preventDefault) {
                  preventDefaultConditional(event, d.preventDefault);
                }
                destinations[j].subject.shamefullySendNext(event);
                processed.add(destinations[j]);
              }
            }
          }
        }
      }
      if (n.length === 0 || n[n.length - 1].type === 'total') {
        break;
      }
      n = n.slice(0, n.length - 1);
    } while (true);
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

  private mutateEventCurrentTarget(
    event: CycleDOMEvent,
    currentTargetElement: Element
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
