import {DevToolEnabledSource} from '@cycle/base';
import xsAdapter from '@cycle/xstream-adapter';
import xs, {Stream} from 'xstream';
import {DOMSource} from './DOMSource';
import {DOMSourceOptions} from './DOMSourceOptions';
import {DOMSourceFactory} from './DOMSourceFactory';
import {VNode} from './interfaces';
import {ElementFinder} from './ElementFinder';
import {EventsFnOptions} from './EventsFnOptions';
import {fromEvent} from './fromEvent';
import {isolateSink, isolateSource} from './isolate';
import {IsolateModule} from './IsolateModule';
import {EventDelegator} from './EventDelegator';
import {getScope} from './utils';

interface MatchesSelector {
  (element: Element, selector: string): boolean;
}

let matchesSelector: MatchesSelector;
declare var require: any;
declare var requestIdleCallback: any;
try {
  matchesSelector = require(`matches-selector`);
} catch (e) {
  matchesSelector = <MatchesSelector>Function.prototype;
}

export interface MainDOMSourceOptions extends DOMSourceOptions {
  namespace?: Array<string>;
  rootElement$: Stream<Element>;
  sanitation$: Stream<any>;
  isolateModule: IsolateModule;
  eventDelegators: Map<string, EventDelegator>;
}

const eventTypesThatDontBubble = [
  `blur`,
  `canplay`,
  `canplaythrough`,
  `change`,
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

const STRING_TYPE = `string`;

export class MainDOMSource extends DOMSource {
  private _namespace: Array<string>;
  private _rootElement$: Stream<Element>;
  private _sanitation$: Stream<{}>;
  private _isolateModule: IsolateModule;
  private _eventDelegators: Map<string, EventDelegator>;

  constructor(options: MainDOMSourceOptions) {
    super(options);
    this._namespace = options.namespace || [];
    this._rootElement$ = options.rootElement$;
    this._sanitation$ = options.sanitation$;
    this._isolateModule = options.isolateModule;
    this._eventDelegators = options.eventDelegators;

    this.__JANI_EVAKALLIO_WE_WILL_MISS_YOU_PLEASE_COME_BACK_EVENTUALLY = true;
  }

  elements(): DevToolEnabledSource {
    const output$: Stream<Element | Array<Element>> = this.outputStream();
    const runStreamAdapter = this._runStreamAdapter;
    const out: DevToolEnabledSource = runStreamAdapter.remember(
      runStreamAdapter.adapt(output$, xsAdapter.streamSubscribe)
    );
    out._isCycleSource = this._driverKey;

    return out;
  }

  private outputStream(): Stream<Element | Array<Element>> {
    if (this._namespace.length === 0) { return this._rootElement$; }
    const elementFinder = new ElementFinder(this._namespace, this._isolateModule);

    return this._rootElement$.map(element => elementFinder.find(element));
  }

  select(selector: string): DOMSource {
    if (typeof selector !== STRING_TYPE) {
      throw new Error(`DOM driver’s select() expects the argument to be a ` +
        `string as a CSS selector`);
    }

    const trimmedSelector = selector.trim();
    const ROOT_SELECTOR = `:root`;
    const childNamespace = trimmedSelector === ROOT_SELECTOR ?
      this._namespace :
      this._namespace.concat(trimmedSelector);
    const options: MainDOMSourceOptions = {
      runStreamAdapter: this._runStreamAdapter,
      driverKey:  this._driverKey,
      namespace: childNamespace,
      rootElement$: this._rootElement$,
      sanitation$: this._sanitation$,
      isolateModule: this._isolateModule,
      eventDelegators: this._eventDelegators,
    };

    return DOMSourceFactory.create(selector, options);
  }

  events(eventType: string, options: EventsFnOptions = {}): DevToolEnabledSource {
    if (typeof eventType !== STRING_TYPE) {
      throw new Error(`DOM driver's events() expects argument to be a ` +
        `string representing the event type to listen for.`);
    }
    const useCapture = options.useCapture ||
      eventTypesThatDontBubble.indexOf(eventType) !== -1;
    const event$ = this.eventStream(eventType, useCapture);
    const out: DevToolEnabledSource =
      this._runStreamAdapter.adapt(event$, xsAdapter.streamSubscribe);
    out._isCycleSource = this._driverKey;

    return out;
  }

  private eventStream(eventType: string, useCapture: boolean): Stream<Event> {
    const namespace = this._namespace;
    const scope = getScope(namespace);
    let rootElement$: Stream<Element>;
    rootElement$ = this.filterRootElementStream(rootElement$, scope);
    const domSource = this;

    return rootElement$
      .map(function setupEventDelegationOnTopElement(rootElement) {
        const createEventListenerOnlyForRootElement = namespace.length === 0;
        if (createEventListenerOnlyForRootElement) {
          return fromEvent(rootElement, eventType, useCapture);
        }

        const eventDelegator = domSource
          .delegateEventOnTopElement(rootElement, scope, eventType, useCapture);
        const destinationId = eventDelegator.createDestinationId();
        const subject$ = domSource.subjectStream(eventDelegator, destinationId);
        eventDelegator.addDestination(subject$, namespace, destinationId);

        return subject$;
      })
      .flatten();
  }

  private filterRootElementStream(
      rootElement$: Stream<Element>,
      scope: string): Stream<Element> {
    const domSource = this;
    if (scope) {
      let foundIsolatedElement = false;
      rootElement$ = this._rootElement$
        .filter(rootElement => {
          const hasIsolatedElement =
            !!domSource._isolateModule.isolatedElementInScope(scope);
          const shouldPass = hasIsolatedElement && !foundIsolatedElement;
          foundIsolatedElement = hasIsolatedElement;

          return shouldPass;
        });
    } else {
      rootElement$ = this._rootElement$.take(2);
    }

    return rootElement$;
  }

  private makeEventDelegatorKey(
      scope: string,
      eventType: string,
      useCapture: boolean): string {
    const keyParts = [eventType, useCapture];
    if (scope) {
      keyParts.push(scope);
    }

    return keyParts.join('~');
  }

  private delegateEventOnTopElement(
      rootElement: Element,
      scope: string,
      eventType: string,
      useCapture: boolean): EventDelegator {
    const eventDelegators = this._eventDelegators;
    const key = this.makeEventDelegatorKey(scope, eventType, useCapture);
    const topElement = this.topElement(rootElement, scope);
    const eventDelegator = eventDelegators.has(key) ?
      this.updateTopElement(topElement, key) :
      this.newEventDelegationOnTopElement(topElement, eventType, useCapture, key);
    if (scope) {
      this._isolateModule.appendEventDelegator(scope, eventDelegator);
    }

    return eventDelegator;
  }

  private topElement(rootElement: Element, scope: string): Element {
    return scope ?
      this._isolateModule.isolatedElementInScope(scope) :
      rootElement;
  }

  private updateTopElement(
      topElement: Element,
      eventDelegatorKey: string): EventDelegator {
    const eventDelegator = this._eventDelegators.get(eventDelegatorKey);
    eventDelegator.updateTopElement(topElement);

    return eventDelegator;
  }

  private newEventDelegationOnTopElement(
      topElement: Element,
      eventType: string,
      useCapture: boolean,
      eventDelegatorKey: string): EventDelegator {
    const eventDelegator = new EventDelegator(
      topElement, eventType, useCapture, this._isolateModule
    );
    this._eventDelegators.set(eventDelegatorKey, eventDelegator);

    return eventDelegator;
  }

  private subjectStream(
      eventDelegator: EventDelegator,
      destinationId: number): Stream<Event> {
    return xs.create<Event>({
      start: () => {},
      stop: () => {
        `requestIdleCallback` in window ?
          requestIdleCallback(() => {
            eventDelegator.removeDestinationId(destinationId);
          }) :
          eventDelegator.removeDestinationId(destinationId);
      }
    });
  }

  dispose(): void {
    const FINAL_VTREE: string = ``;
    this._sanitation$.shamefullySendNext(FINAL_VTREE);
    this._isolateModule.reset();
  }

  private __JANI_EVAKALLIO_WE_WILL_MISS_YOU_PLEASE_COME_BACK_EVENTUALLY: boolean = false;

  public isolateSource: (source: DOMSource, scope: string) => DOMSource = isolateSource;
  public isolateSink: (sink: Stream<VNode>, scope: string) => Stream<VNode> = isolateSink;
}
