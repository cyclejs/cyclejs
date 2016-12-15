import {Stream, MemoryStream} from 'xstream';
import {DevToolEnabledSource} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {DocumentDOMSource} from './DocumentDOMSource';
import {BodyDOMSource} from './BodyDOMSource';
import {VNode} from './interfaces';
import xs from 'xstream';
import {ElementFinder} from './ElementFinder';
import {fromEvent} from './fromEvent';
import {isolateSink as internalIsolateSink, isolateSource} from './isolate';
import {IsolateModule} from './isolateModule';
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
  matchesSelector = Function.prototype as MatchesSelector;
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

function determineUseCapture(eventType: string, options: EventsFnOptions): boolean {
  let result = false;
  if (typeof options.useCapture === 'boolean') {
    result = options.useCapture;
  }
  if (eventTypesThatDontBubble.indexOf(eventType) !== -1) {
    result = true;
  }
  return result;
}

function filterBasedOnIsolation(domSource: MainDOMSource, scope: string) {
  return function filterBasedOnIsolationOperator(rootElement$: Stream<Element>): Stream<Element> {
    interface State {
      hadIsolatedMutable: boolean;
      shouldPass: boolean;
      element: Element;
    }

    return rootElement$
      .fold(
        function shouldPass(state: State, element: Element) {
          const hasIsolated = !!domSource._isolateModule.getIsolatedElement(scope);
          const shouldPass = hasIsolated && !state.hadIsolatedMutable;
          return {hadIsolatedMutable: hasIsolated, shouldPass, element};
        },
        {hadIsolatedMutable: false, shouldPass: false, element: null as any as Element},
      )
      .drop(1)
      .filter(s => s.shouldPass)
      .map(s => s.element);
  };
}

export class MainDOMSource implements DOMSource {

  constructor(private _rootElement$: Stream<Element>,
              private _sanitation$: Stream<{}>,
              private _namespace: Array<string> = [],
              public _isolateModule: IsolateModule,
              public _delegators: Map<string, EventDelegator>,
              private _name: string) {
    this.isolateSource = isolateSource;
    this.isolateSink = (sink, scope) => {
      const existingScope = getScope(this._namespace);
      const deeperScope = [existingScope, scope].filter(x => !!x).join('-');
      return internalIsolateSink(sink, deeperScope);
    };
  }

  public elements(): MemoryStream<Element> {
    let output$: Stream<Element | Array<Element>>;
    if (this._namespace.length === 0) {
      output$ = this._rootElement$;
    } else {
      const elementFinder = new ElementFinder(this._namespace, this._isolateModule);
      output$ = this._rootElement$.map(el => elementFinder.call(el));
    }
    const out: DevToolEnabledSource & MemoryStream<Element> = adapt(output$.remember());
    out._isCycleSource = this._name;
    return out;
  }

  get namespace(): Array<string> {
    return this._namespace;
  }

  public select(selector: string): DOMSource {
    if (typeof selector !== 'string') {
      throw new Error(`DOM driver's select() expects the argument to be a ` +
        `string as a CSS selector`);
    }
    if (selector === 'document') {
      return new DocumentDOMSource(this._name);
    }
    if (selector === 'body') {
      return new BodyDOMSource(this._name);
    }
    const trimmedSelector = selector.trim();
    const childNamespace = trimmedSelector === `:root` ?
      this._namespace :
      this._namespace.concat(trimmedSelector);
    return new MainDOMSource(
      this._rootElement$,
      this._sanitation$,
      childNamespace,
      this._isolateModule,
      this._delegators,
      this._name,
    );
  }

  public events(eventType: string, options: EventsFnOptions = {}): Stream<Event> {
    if (typeof eventType !== `string`) {
      throw new Error(`DOM driver's events() expects argument to be a ` +
        `string representing the event type to listen for.`);
    }
    const useCapture: boolean = determineUseCapture(eventType, options);

    const namespace = this._namespace;
    const scope = getScope(namespace);
    const keyParts = [eventType, useCapture];
    if (scope) {
      keyParts.push(scope);
    }
    const key = keyParts.join('~');
    const domSource = this;
    let rootElement$: Stream<Element>;

    if (scope) {
      rootElement$ = this._rootElement$
        .compose(filterBasedOnIsolation(domSource, scope));
    } else {
      rootElement$ = this._rootElement$.take(2);
    }

    const event$: Stream<Event> = rootElement$
      .map(function setupEventDelegatorOnTopElement(rootElement) {
        // Event listener just for the root element
        if (!namespace || namespace.length === 0) {
          return fromEvent(rootElement, eventType, useCapture);
        }

        // Event listener on the top element as an EventDelegator
        const delegators = domSource._delegators;
        const top = domSource._isolateModule.getIsolatedElement(scope) || rootElement;
        let delegator: EventDelegator;
        if (delegators.has(key)) {
          delegator = delegators.get(key) as EventDelegator;
          delegator.updateTopElement(top);
        } else {
          delegator = new EventDelegator(
            top, eventType, useCapture, domSource._isolateModule,
          );
          delegators.set(key, delegator);
        }
        if (scope) {
          domSource._isolateModule.addEventDelegator(scope, delegator);
        }

        const destinationId = delegator.createDestinationId();
        const subject = xs.create<Event>({
          start: () => {},
          stop: () => {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => {
                delegator.removeDestinationId(destinationId);
              });
            } else {
              delegator.removeDestinationId(destinationId);
            }
          },
        });

        delegator.addDestination(subject, namespace, destinationId);
        return subject;
      })
      .flatten();

    const out: DevToolEnabledSource & Stream<Event> = adapt(event$);
    out._isCycleSource = domSource._name;
    return out;
  }

  public dispose(): void {
    this._sanitation$.shamefullySendNext('');
    this._isolateModule.reset();
  }

  // The implementation of these are in the constructor so that their `this`
  // references are automatically bound to the instance, so that library users
  // can do destructuring `const {isolateSource, isolateSink} = sources.DOM` and
  // not get bitten by a missing `this` reference.

  public isolateSource: (source: MainDOMSource, scope: string) => MainDOMSource;
  public isolateSink: (sink: Stream<VNode>, scope: string) => Stream<VNode>;
}
