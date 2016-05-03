import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import {Stream} from 'xstream';
import {VNode} from 'snabbdom';
import {BubblingSimulator} from './BubblingSimulator';
import {ElementFinder} from './ElementFinder';
import {fromEvent} from './fromEvent';
import {isolateSink, isolateSource} from './isolate';
import {IsolateModule} from './isolateModule';
import {getSelectors} from './utils';

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
  if (eventTypesThatDontBubble.indexOf(eventType) !== -1) {
    result = true;
  }
  if (typeof options.useCapture === `boolean`) {
    result = options.useCapture;
  }
  return result;
}

export class DOMSource {
  constructor(private rootElement$: Stream<Element>,
              private runStreamAdapter: StreamAdapter,
              private _namespace: Array<string> = [],
              public isolateModule: IsolateModule) {
  }

  get elements(): any {
    if (this._namespace.length === 0) {
      return this.runStreamAdapter.adapt(
        this.rootElement$,
        XStreamAdapter.streamSubscribe
      );
    } else {
      const elementFinder = new ElementFinder(
        this._namespace, this.isolateModule
      );
      return this.runStreamAdapter.adapt(
        this.rootElement$.map(el => elementFinder.call(el)),
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
      this.rootElement$,
      this.runStreamAdapter,
      childNamespace,
      this.isolateModule
    );
  }

  events(eventType: string, options: EventsFnOptions = {}): any {
    if (typeof eventType !== `string`) {
      throw new Error(`DOM driver's events() expects argument to be a ` +
        `string representing the event type to listen for.`);
    }
    const useCapture: boolean = determineUseCapture(eventType, options);

    const originStream = this.rootElement$
      .take(2) // 1st is the given container, 2nd is the re-rendered container
      .map(rootElement => {
        const namespace = this._namespace;
        const selector = getSelectors(namespace);
        if (!namespace || namespace.length === 0) {
          return fromEvent(rootElement, eventType, useCapture);
        }
        const bubblingSimulator = new BubblingSimulator(
          namespace, rootElement, this.isolateModule
        );

        const event$ = fromEvent(rootElement, eventType, useCapture);

        return eventTypesThatDontBubble.indexOf(eventType) !== -1
          ? event$.filter(ev => matchesSelector((<Element> ev.target), selector))
          : event$.filter(ev => bubblingSimulator.shouldPropagate(ev));
      })
      .flatten();

    return this.runStreamAdapter.adapt(
      originStream,
      XStreamAdapter.streamSubscribe
    );
  }

  dispose(): void {
    this.isolateModule.reset();
  }

  public isolateSource: (source: DOMSource, scope: string) => DOMSource = isolateSource;
  public isolateSink: (sink: Stream<VNode>, scope: string) => Stream<VNode> = isolateSink;
}
