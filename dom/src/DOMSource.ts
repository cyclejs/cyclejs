import {StreamAdapter} from '@cycle/base';
import RxAdapter from '@cycle/rx-adapter';
import {Observable, Disposable} from 'rx';
import {BubblingSimulator} from './BubblingSimulator';
import {ElementFinder} from './ElementFinder';
import {fromEvent} from './fromEvent';
import {isolateSink, isolateSource} from './isolate';

function isValidString(param: any): boolean {
  return typeof param === `string` && param.length > 0;
}

function contains(str: string, match: string): boolean {
  return str.indexOf(match) > -1;
}

function isNotTagName(param: any): boolean {
  return isValidString(param) &&
    contains(param, `.`) || contains(param, `#`) || contains(param, `:`);
}

function sortNamespace(a: any, b: any): number {
  if (isNotTagName(a) && isNotTagName(b)) {
    return 0;
  }
  return isNotTagName(a) ? 1 : -1;
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
  constructor(private rootElement$: Observable<any>,
              private runStreamAdapter: StreamAdapter,
              private _namespace: Array<string> = [],
              private disposable?: Disposable) {
  }

  get element$(): any {
    console.log(this.runStreamAdapter);
    if (this._namespace.length === 0) {
      return this.runStreamAdapter.adapt(
        this.rootElement$,
        RxAdapter.streamSubscribe
      );
    } else {
      const elementFinder = new ElementFinder(this._namespace);
      return this.runStreamAdapter.adapt(
        this.rootElement$.map(elementFinder.call, elementFinder),
        RxAdapter.streamSubscribe
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
      this._namespace.concat(trimmedSelector).sort(sortNamespace);
    return new DOMSource(this.rootElement$, this.runStreamAdapter, childNamespace);
  }

  events(eventType: string, options: EventsFnOptions = {}): any {
    if (typeof eventType !== `string`) {
      throw new Error(`DOM driver's events() expects argument to be a ` +
        `string representing the event type to listen for.`);
    }
    const useCapture: boolean = determineUseCapture(eventType, options);

    const originStream = this.rootElement$
      .take(2) // 1st is the given container, 2nd is the re-rendered container
      .flatMapLatest(rootElement => {
        const namespace = this._namespace;
        if (!namespace || namespace.length === 0) {
          return fromEvent(rootElement, eventType, useCapture);
        }
        const bubblingSimulator = new BubblingSimulator(namespace, rootElement);
        return fromEvent(rootElement, eventType, useCapture)
          .filter(bubblingSimulator.shouldPropagate, bubblingSimulator);
      })
      .share();

    return this.runStreamAdapter.adapt(
      originStream,
      RxAdapter.streamSubscribe
    );
  }

  dispose(): void {
    if (this.disposable) {
      this.disposable.dispose();
    }
  }

  public isolateSource: (source: DOMSource, scope: string) => DOMSource = isolateSource;
  public isolateSink: (sink: Observable<any>, scope: string) => Observable<any> = isolateSink;
}
