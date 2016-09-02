import {StreamAdapter, DevToolEnabledSource} from '@cycle/base';
import xsSA from '@cycle/xstream-adapter';
import {Stream} from 'xstream';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {DocumentDOMSource} from './DocumentDOMSource';
import {BodyDOMSource} from './BodyDOMSource';
import {VNode} from './interfaces';
import xs from 'xstream';
import {ElementFinder} from './ElementFinder';
import {fromEvent} from './fromEvent';
import {isolateSink, isolateSource} from './isolate';
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
  matchesSelector = <MatchesSelector> Function.prototype;
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
  if (typeof options.useCapture === `boolean`) {
    result = options.useCapture;
  }
  if (eventTypesThatDontBubble.indexOf(eventType) !== -1) {
    result = true;
  }
  return result;
}

export class MainDOMSource implements DOMSource {
  constructor(private _rootElement$: Stream<Element>,
              private _runStreamAdapter: StreamAdapter,
              private _namespace: Array<string> = [],
              public _isolateModule: IsolateModule,
              public _delegators: Map<string, EventDelegator>,
              private _name: string) {
    this.__JANI_EVAKALLIO_WE_WILL_MISS_YOU_PLEASE_COME_BACK_EVENTUALLY = true;
  }

  elements(): any {
    let output$: Stream<Element | Array<Element>>;
    if (this._namespace.length === 0) {
      output$ = this._rootElement$;
    } else {
      const elementFinder = new ElementFinder(
        this._namespace, this._isolateModule
      );
      output$ = this._rootElement$.map(el => elementFinder.call(el));
    }
    const runSA = this._runStreamAdapter;
    const out: DevToolEnabledSource = runSA.remember(
      runSA.adapt(output$, xsSA.streamSubscribe)
    );
    out._isCycleSource = this._name;
    return out;
  }

  get namespace(): Array<string> {
    return this._namespace;
  }

  select(selector: string): DOMSource {
    if (typeof selector !== 'string') {
      throw new Error(`DOM driver's select() expects the argument to be a ` +
        `string as a CSS selector`);
    }
    if (selector === 'document') {
      return new DocumentDOMSource(this._runStreamAdapter, this._name);
    }
    if (selector === 'body') {
      return new BodyDOMSource(this._runStreamAdapter, this._name);
    }
    const trimmedSelector = selector.trim();
    const childNamespace = trimmedSelector === `:root` ?
      this._namespace :
      this._namespace.concat(trimmedSelector);
    return new MainDOMSource(
      this._rootElement$,
      this._runStreamAdapter,
      childNamespace,
      this._isolateModule,
      this._delegators,
      this._name
    );
  }

  events(eventType: string, options: EventsFnOptions = {}): any {
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
      let hadIsolated_mutable = false;
      rootElement$ = this._rootElement$
        .filter(rootElement => {
          const hasIsolated = !!domSource._isolateModule.getIsolatedElement(scope);
          const shouldPass = hasIsolated && !hadIsolated_mutable;
          hadIsolated_mutable = hasIsolated;
          return shouldPass;
        });
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
        const top = scope
          ? domSource._isolateModule.getIsolatedElement(scope)
          : rootElement;
        let delegator: EventDelegator;
        if (delegators.has(key)) {
          delegator = delegators.get(key);
          delegator.updateTopElement(top);
        } else {
          delegator = new EventDelegator(
            top, eventType, useCapture, domSource._isolateModule
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
          }
        });

        delegator.addDestination(subject, namespace, destinationId);
        return subject;
      })
      .flatten();

    const out: DevToolEnabledSource = this._runStreamAdapter.adapt(event$, xsSA.streamSubscribe);
    out._isCycleSource = domSource._name;
    return out;
  }

  dispose(): void {
    this._isolateModule.reset();
  }

  private __JANI_EVAKALLIO_WE_WILL_MISS_YOU_PLEASE_COME_BACK_EVENTUALLY: boolean = false;

  public isolateSource: (source: DOMSource, scope: string) => DOMSource = isolateSource;
  public isolateSink: (sink: Stream<VNode>, scope: string) => Stream<VNode> = isolateSink;
}
