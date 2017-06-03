import xs from 'xstream';
import {Stream, MemoryStream} from 'xstream';
import {DevToolEnabledSource} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {DocumentDOMSource} from './DocumentDOMSource';
import {BodyDOMSource} from './BodyDOMSource';
import {VNode} from 'snabbdom/vnode';
import {ElementFinder} from './ElementFinder';
import {fromEvent} from './fromEvent';
import {totalIsolateSink, siblingIsolateSink, isolateSource} from './isolate';
import {IsolateModule} from './IsolateModule';
import {EventDelegator} from './EventDelegator';
import {getFullScope, isClassOrId} from './utils';
import {matchesSelector} from './matchesSelector';

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

function determineUseCapture(
  eventType: string,
  options: EventsFnOptions,
): boolean {
  let result = false;
  if (typeof options.useCapture === 'boolean') {
    result = options.useCapture;
  }
  if (eventTypesThatDontBubble.indexOf(eventType) !== -1) {
    result = true;
  }
  return result;
}

function filterBasedOnIsolation(domSource: MainDOMSource, fullScope: string) {
  return function filterBasedOnIsolationOperator(
    rootElement$: Stream<Element>,
  ): Stream<Element> {
    interface State {
      wasIsolated: boolean;
      shouldPass: boolean;
      element: Element;
    }
    const initialState: State = {
      wasIsolated: false,
      shouldPass: false,
      element: (null as any) as Element,
    };

    return rootElement$
      .fold(function checkIfShouldPass(state: State, element: Element) {
        const isIsolated = !!domSource._isolateModule.getElement(fullScope);
        state.shouldPass = isIsolated && !state.wasIsolated;
        state.wasIsolated = isIsolated;
        state.element = element;
        return state;
      }, initialState)
      .drop(1)
      .filter(s => s.shouldPass)
      .map(s => s.element);
  };
}

export class MainDOMSource implements DOMSource {
  constructor(
    private _rootElement$: Stream<Element>,
    private _sanitation$: Stream<null>,
    private _namespace: Array<string> = [],
    public _isolateModule: IsolateModule,
    public _delegators: Map<string, EventDelegator>,
    private _name: string,
  ) {
    this.isolateSource = isolateSource;
    this.isolateSink = (sink, scope) => {
      if (scope === ':root') {
        return sink;
      } else if (isClassOrId(scope)) {
        return siblingIsolateSink(sink, scope);
      } else {
        const prevFullScope = getFullScope(this._namespace);
        const nextFullScope = [prevFullScope, scope].filter(x => !!x).join('-');
        return totalIsolateSink(sink, nextFullScope);
      }
    };
  }

  public elements(): MemoryStream<Element> {
    let output$: Stream<Element | Array<Element>>;
    if (this._namespace.length === 0) {
      output$ = this._rootElement$;
    } else {
      const elementFinder = new ElementFinder(
        this._namespace,
        this._isolateModule,
      );
      output$ = this._rootElement$.map(el => elementFinder.call(el));
    }
    const out: DevToolEnabledSource & MemoryStream<Element> = adapt(
      output$.remember(),
    );
    out._isCycleSource = this._name;
    return out;
  }

  get namespace(): Array<string> {
    return this._namespace;
  }

  public select(selector: string): DOMSource {
    if (typeof selector !== 'string') {
      throw new Error(
        `DOM driver's select() expects the argument to be a ` +
          `string as a CSS selector`,
      );
    }
    if (selector === 'document') {
      return new DocumentDOMSource(this._name);
    }
    if (selector === 'body') {
      return new BodyDOMSource(this._name);
    }
    const trimmedSelector = selector.trim();
    const childNamespace = trimmedSelector === `:root`
      ? this._namespace
      : this._namespace.concat(trimmedSelector);
    return new MainDOMSource(
      this._rootElement$,
      this._sanitation$,
      childNamespace,
      this._isolateModule,
      this._delegators,
      this._name,
    );
  }

  public events(
    eventType: string,
    options: EventsFnOptions = {},
  ): Stream<Event> {
    if (typeof eventType !== `string`) {
      throw new Error(
        `DOM driver's events() expects argument to be a ` +
          `string representing the event type to listen for.`,
      );
    }
    const useCapture: boolean = determineUseCapture(eventType, options);

    const namespace = this._namespace;
    const fullScope = getFullScope(namespace);
    const keyParts = [eventType, useCapture];
    if (fullScope) {
      keyParts.push(fullScope);
    }
    const key = keyParts.join('~');
    const domSource = this;

    let rootElement$: Stream<Element>;
    if (fullScope) {
      rootElement$ = this._rootElement$.compose(
        filterBasedOnIsolation(domSource, fullScope),
      );
    } else {
      rootElement$ = this._rootElement$.take(2);
    }

    const event$: Stream<Event> = rootElement$
      .map(function setupEventDelegatorOnTopElement(rootElement) {
        // Event listener just for the root element
        if (!namespace || namespace.length === 0) {
          return fromEvent(
            rootElement,
            eventType,
            useCapture,
            options.preventDefault,
          );
        }

        // Event listener on the origin element as an EventDelegator
        const delegators = domSource._delegators;
        const origin =
          domSource._isolateModule.getElement(fullScope) || rootElement;
        let delegator: EventDelegator;
        if (delegators.has(key)) {
          delegator = delegators.get(key) as EventDelegator;
          delegator.updateOrigin(origin);
        } else {
          delegator = new EventDelegator(
            origin,
            eventType,
            useCapture,
            domSource._isolateModule,
            options.preventDefault,
          );
          delegators.set(key, delegator);
        }
        if (fullScope) {
          domSource._isolateModule.addEventDelegator(fullScope, delegator);
        }

        const subject = delegator.createDestination(namespace);
        return subject;
      })
      .flatten();

    const out: DevToolEnabledSource & Stream<Event> = adapt(event$);
    out._isCycleSource = domSource._name;
    return out;
  }

  public dispose(): void {
    this._sanitation$.shamefullySendNext(null);
    this._isolateModule.reset();
  }

  // The implementation of these are in the constructor so that their `this`
  // references are automatically bound to the instance, so that library users
  // can do destructuring `const {isolateSource, isolateSink} = sources.DOM` and
  // not get bitten by a missing `this` reference.

  public isolateSource: (source: MainDOMSource, scope: string) => MainDOMSource;
  public isolateSink: typeof siblingIsolateSink;
}
