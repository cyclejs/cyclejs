import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import {Stream} from 'xstream';
import {VNode} from 'snabbdom';
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
try {
  matchesSelector = require(`matches-selector`);
} catch (e) {
  matchesSelector = <MatchesSelector> Function.prototype;
}

const eventTypesThatDontBubble = [
  `load`,
  `unload`,
  `focus`,
  `blur`,
  `mouseenter`,
  `mouseleave`,
  `submit`,
  `change`,
  `reset`,
  `timeupdate`,
  `playing`,
  `waiting`,
  `seeking`,
  `seeked`,
  `ended`,
  `loadedmetadata`,
  `loadeddata`,
  `canplay`,
  `canplaythrough`,
  `durationchange`,
  `play`,
  `pause`,
  `ratechange`,
  `volumechange`,
  `suspend`,
  `emptied`,
  `stalled`,
];

export interface EventsFnOptions {
  useCapture?: boolean;
}

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

export class DOMSource {
  constructor(private _rootElement$: Stream<Element>,
              private _runStreamAdapter: StreamAdapter,
              private _namespace: Array<string> = [],
              public _isolateModule: IsolateModule,
              public _delegators: Map<string, EventDelegator>) {
  }

  get elements(): any {
    if (this._namespace.length === 0) {
      return this._runStreamAdapter.adapt(
        this._rootElement$,
        XStreamAdapter.streamSubscribe
      );
    } else {
      const elementFinder = new ElementFinder(
        this._namespace, this._isolateModule
      );
      return this._runStreamAdapter.adapt(
        this._rootElement$.map(el => elementFinder.call(el)),
        XStreamAdapter.streamSubscribe
      );
    }
  }

  get namespace(): Array<string> {
    return this._namespace;
  }

  select(selector: string): DOMSource {
    if (typeof selector !== 'string') {
      throw new Error(`DOM driver's select() expects the argument to be a ` +
        `string as a CSS selector`);
    }
    const trimmedSelector = selector.trim();
    const childNamespace = trimmedSelector === `:root` ?
      this._namespace :
      this._namespace.concat(trimmedSelector);
    return new DOMSource(
      this._rootElement$,
      this._runStreamAdapter,
      childNamespace,
      this._isolateModule,
      this._delegators
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
      rootElement$ = this._rootElement$
        .filter(function checkRootHasRenderedScope(rootElement) {
          return !!domSource._isolateModule.getIsolatedElement(scope);
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
        const subject = xs.create<Event>();
        if (scope) {
          domSource._isolateModule.addEventDelegator(scope, delegator);
        }
        delegator.addDestination(subject, namespace);
        return subject;
      })
      .flatten();

    return this._runStreamAdapter.adapt(
      event$,
      XStreamAdapter.streamSubscribe
    );
  }

  dispose(): void {
    this._isolateModule.reset();
  }

  public isolateSource: (source: DOMSource, scope: string) => DOMSource = isolateSource;
  public isolateSink: (sink: Stream<VNode>, scope: string) => Stream<VNode> = isolateSink;
}
