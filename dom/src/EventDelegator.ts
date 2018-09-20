import xs, {Stream, Subscription} from 'xstream';
import {ScopeChecker} from './ScopeChecker';
import {IsolateModule} from './IsolateModule';
import {getSelectors, makeInsert} from './utils';
import {ElementFinder} from './ElementFinder';
import {EventsFnOptions} from './DOMSource';
import {Scope} from './isolate';
import SymbolTree from './SymbolTree';
import RemovalSet from './RemovalSet';
import PriorityQueue from './PriorityQueue';
import {
  fromEvent,
  preventDefaultConditional,
  PreventDefaultOpt,
} from './fromEvent';
declare var requestIdleCallback: any;

interface Destination {
  useCapture: boolean;
  bubbles: boolean;
  passive: boolean;
  scopeChecker: ScopeChecker;
  subject: Stream<Event>;
  preventDefault?: PreventDefaultOpt;
}

export interface CycleDOMEvent extends Event {
  propagationHasBeenStopped: boolean;
  ownerTarget: Element;
}

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
  private virtualListeners = new SymbolTree<
    Map<string, PriorityQueue<Destination>>,
    Scope
  >(x => x.scope);
  private origin: Element | undefined;

  private domListeners: Map<string, DOMListener>;
  private nonBubblingListeners: Map<string, Map<Element, NonBubblingListener>>;
  private domListenersToAdd: Map<string, boolean>;
  private nonBubblingListenersToAdd = new RemovalSet<
    [string, ElementFinder, Destination]
  >();

  private virtualNonBubblingListener: Array<Destination> = [];

  constructor(
    private rootElement$: Stream<Element>,
    public isolateModule: IsolateModule
  ) {
    this.isolateModule.setEventDelegator(this);
    this.domListeners = new Map<string, DOMListener>();
    this.domListenersToAdd = new Map<string, boolean>();
    this.nonBubblingListeners = new Map<
      string,
      Map<Element, NonBubblingListener>
    >();
    rootElement$.addListener({
      next: el => {
        if (this.origin !== el) {
          this.origin = el;
          this.resetEventListeners();
          this.domListenersToAdd.forEach((passive, type) =>
            this.setupDOMListener(type, passive)
          );
          this.domListenersToAdd.clear();
        }

        this.resetNonBubblingListeners();
        this.nonBubblingListenersToAdd.forEach(arr => {
          this.setupNonBubblingListener(arr);
        });
      },
    });
  }

  public addEventListener(
    eventType: string,
    namespace: Array<Scope>,
    options: EventsFnOptions,
    bubbles?: boolean
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
      }
    } else {
      const finder = new ElementFinder(namespace, this.isolateModule);
      this.setupNonBubblingListener([eventType, finder, dest]);
    }

    return subject;
  }

  public removeElement(element: Element, namespace?: Array<Scope>): void {
    if (namespace !== undefined) {
      this.virtualListeners.delete(namespace);
    }
    const toRemove: Array<[string, Element]> = [];
    this.nonBubblingListeners.forEach((map, type) => {
      if (map.has(element)) {
        toRemove.push([type, element]);
      }
    });
    for (let i = 0; i < toRemove.length; i++) {
      const map = this.nonBubblingListeners.get(toRemove[i][0]);
      if (!map) {
        continue;
      }
      map.delete(toRemove[i][1]);
      if (map.size === 0) {
        this.nonBubblingListeners.delete(toRemove[i][0]);
      } else {
        this.nonBubblingListeners.set(toRemove[i][0], map);
      }
    }
  }

  private insertListener(
    subject: Stream<Event>,
    scopeChecker: ScopeChecker,
    eventType: string,
    options: EventsFnOptions
  ): Destination {
    const relevantSets: Array<PriorityQueue<Destination>> = [];
    const n = scopeChecker._namespace;
    let max = n.length;

    do {
      relevantSets.push(this.getVirtualListeners(eventType, n, true, max));
      max--;
    } while (max >= 0 && n[max].type !== 'total');

    const destination = {
      ...options,
      scopeChecker,
      subject,
      bubbles: !!options.bubbles,
      useCapture: !!options.useCapture,
      passive: !!options.passive,
    };

    for (let i = 0; i < relevantSets.length; i++) {
      relevantSets[i].add(destination, n.length);
    }

    return destination;
  }

  /**
   * Returns a set of all virtual listeners in the scope of the namespace
   * Set `exact` to true to treat sibiling isolated scopes as total scopes
   */
  private getVirtualListeners(
    eventType: string,
    namespace: Array<Scope>,
    exact = false,
    max?: number
  ): PriorityQueue<Destination> {
    let _max = max !== undefined ? max : namespace.length;
    if (!exact) {
      for (let i = _max - 1; i >= 0; i--) {
        if (namespace[i].type === 'total') {
          _max = i + 1;
          break;
        }
        _max = i;
      }
    }

    const map = this.virtualListeners.getDefault(
      namespace,
      () => new Map<string, PriorityQueue<Destination>>(),
      _max
    );

    if (!map.has(eventType)) {
      map.set(eventType, new PriorityQueue<Destination>());
    }
    return map.get(eventType) as PriorityQueue<Destination>;
  }

  private setupDOMListener(eventType: string, passive: boolean): void {
    if (this.origin) {
      const sub = fromEvent(
        this.origin,
        eventType,
        false,
        false,
        passive
      ).subscribe({
        next: event => this.onEvent(eventType, event, passive),
        error: () => {},
        complete: () => {},
      });
      this.domListeners.set(eventType, {sub, passive});
    } else {
      this.domListenersToAdd.set(eventType, passive);
    }
  }

  private setupNonBubblingListener(
    input: [string, ElementFinder, Destination]
  ): void {
    const [eventType, elementFinder, destination] = input;
    if (!this.origin) {
      this.nonBubblingListenersToAdd.add(input);
      return;
    }

    const element = elementFinder.call()[0];
    if (element) {
      this.nonBubblingListenersToAdd.delete(input);

      const sub = fromEvent(
        element,
        eventType,
        false,
        false,
        destination.passive
      ).subscribe({
        next: ev => this.onEvent(eventType, ev, !!destination.passive, false),
        error: () => {},
        complete: () => {},
      });
      if (!this.nonBubblingListeners.has(eventType)) {
        this.nonBubblingListeners.set(
          eventType,
          new Map<Element, NonBubblingListener>()
        );
      }
      const map = this.nonBubblingListeners.get(eventType);
      if (!map) {
        return;
      }
      map.set(element, {sub, destination});
    } else {
      this.nonBubblingListenersToAdd.add(input);
    }
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
            this.isolateModule
          );
          const newElm = elementFinder.call()[0];
          const newSub = fromEvent(
            newElm,
            type,
            false,
            false,
            destination.passive
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

  private putNonBubblingListener(
    eventType: string,
    elm: Element,
    useCapture: boolean,
    passive: boolean
  ): void {
    const map = this.nonBubblingListeners.get(eventType);
    if (!map) {
      return;
    }
    const listener = map.get(elm);
    if (
      listener &&
      listener.destination.passive === passive &&
      listener.destination.useCapture === useCapture
    ) {
      this.virtualNonBubblingListener[0] = listener.destination;
    }
  }

  private onEvent(
    eventType: string,
    event: Event,
    passive: boolean,
    bubbles = true
  ): void {
    const cycleEvent = this.patchEvent(event);
    const rootElement = this.isolateModule.getRootElement(
      event.target as Element
    );

    if (bubbles) {
      const namespace = this.isolateModule.getNamespace(
        event.target as Element
      );
      if (!namespace) {
        return;
      }
      const listeners = this.getVirtualListeners(eventType, namespace);
      this.bubble(
        eventType,
        event.target as Element,
        rootElement,
        cycleEvent,
        listeners,
        namespace,
        namespace.length - 1,
        true,
        passive
      );

      this.bubble(
        eventType,
        event.target as Element,
        rootElement,
        cycleEvent,
        listeners,
        namespace,
        namespace.length - 1,
        false,
        passive
      );
    } else {
      this.putNonBubblingListener(
        eventType,
        event.target as Element,
        true,
        passive
      );
      this.doBubbleStep(
        eventType,
        event.target as Element,
        rootElement,
        cycleEvent,
        this.virtualNonBubblingListener,
        true,
        passive
      );

      this.putNonBubblingListener(
        eventType,
        event.target as Element,
        false,
        passive
      );
      this.doBubbleStep(
        eventType,
        event.target as Element,
        rootElement,
        cycleEvent,
        this.virtualNonBubblingListener,
        false,
        passive
      );
      event.stopPropagation(); //fix reset event (spec'ed as non-bubbling, but bubbles in reality
    }
  }

  private bubble(
    eventType: string,
    elm: Element,
    rootElement: Element | undefined,
    event: CycleDOMEvent,
    listeners: PriorityQueue<Destination>,
    namespace: Array<Scope>,
    index: number,
    useCapture: boolean,
    passive: boolean
  ): void {
    if (!useCapture && !event.propagationHasBeenStopped) {
      this.doBubbleStep(
        eventType,
        elm,
        rootElement,
        event,
        listeners,
        useCapture,
        passive
      );
    }

    let newRoot: Element | undefined = rootElement;
    let newIndex = index;
    if (elm === rootElement) {
      if (index >= 0 && namespace[index].type === 'sibling') {
        newRoot = this.isolateModule.getElement(namespace, index);
        newIndex--;
      } else {
        return;
      }
    }

    if (elm.parentNode && newRoot) {
      this.bubble(
        eventType,
        elm.parentNode as Element,
        newRoot,
        event,
        listeners,
        namespace,
        newIndex,
        useCapture,
        passive
      );
    }

    if (useCapture && !event.propagationHasBeenStopped) {
      this.doBubbleStep(
        eventType,
        elm,
        rootElement,
        event,
        listeners,
        useCapture,
        passive
      );
    }
  }

  private doBubbleStep(
    eventType: string,
    elm: Element,
    rootElement: Element | undefined,
    event: CycleDOMEvent,
    listeners: PriorityQueue<Destination> | Array<Destination>,
    useCapture: boolean,
    passive: boolean
  ): void {
    if (!rootElement) {
      return;
    }
    this.mutateEventCurrentTarget(event, elm);
    listeners.forEach(dest => {
      if (dest.passive === passive && dest.useCapture === useCapture) {
        const sel = getSelectors(dest.scopeChecker.namespace);
        if (
          !event.propagationHasBeenStopped &&
          dest.scopeChecker.isDirectlyInScope(elm) &&
          ((sel !== '' && elm.matches(sel)) ||
            (sel === '' && elm === rootElement))
        ) {
          preventDefaultConditional(
            event,
            dest.preventDefault as PreventDefaultOpt
          );
          dest.subject.shamefullySendNext(event);
        }
      }
    });
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
