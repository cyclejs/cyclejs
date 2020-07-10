import xs from 'xstream';
import {Stream, MemoryStream} from 'xstream';
import {DevToolEnabledSource} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {DocumentDOMSource} from './DocumentDOMSource';
import {BodyDOMSource} from './BodyDOMSource';
import {VNode} from 'snabbdom/vnode';
import {ElementFinder} from './ElementFinder';
import {makeIsolateSink, getScopeObj, Scope, IsolateSink} from './isolate';
import {IsolateModule} from './IsolateModule';
import {EventDelegator} from './EventDelegator';

export interface SpecialSelector {
  body: BodyDOMSource;
  document: DocumentDOMSource;
}

export class MainDOMSource {
  constructor(
    private _rootElement$: Stream<Element>,
    private _sanitation$: Stream<null>,
    private _namespace: Array<Scope> = [],
    public _isolateModule: IsolateModule,
    private _eventDelegator: EventDelegator,
    private _name: string
  ) {
    this.isolateSource = (source, scope) =>
      new MainDOMSource(
        source._rootElement$,
        source._sanitation$,
        source._namespace.concat(getScopeObj(scope)),
        source._isolateModule,
        source._eventDelegator,
        source._name
      );
    this.isolateSink = makeIsolateSink(this._namespace) as any;
  }

  private _elements(): Stream<Array<Element>> {
    if (this._namespace.length === 0) {
      return this._rootElement$.map(x => [x]);
    } else {
      const elementFinder = new ElementFinder(
        this._namespace,
        this._isolateModule
      );
      return this._rootElement$.map(() => elementFinder.call());
    }
  }

  public elements(): MemoryStream<Array<Element>> {
    const out: DevToolEnabledSource & MemoryStream<Array<Element>> = adapt(
      this._elements().remember()
    );
    out._isCycleSource = this._name;
    return out;
  }

  public element(): MemoryStream<Element> {
    const out: DevToolEnabledSource & MemoryStream<Element> = adapt(
      this._elements()
        .filter(arr => arr.length > 0)
        .map(arr => arr[0])
        .remember()
    );
    out._isCycleSource = this._name;
    return out;
  }

  get namespace(): Array<Scope> {
    return this._namespace;
  }

  public select<T extends keyof SpecialSelector>(
    selector: T
  ): SpecialSelector[T];
  public select(selector: string): MainDOMSource;
  public select(selector: string): DOMSource {
    if (typeof selector !== 'string') {
      throw new Error(
        `DOM driver's select() expects the argument to be a ` +
          `string as a CSS selector`
      );
    }
    if (selector === 'document') {
      return new DocumentDOMSource(this._name);
    }
    if (selector === 'body') {
      return new BodyDOMSource(this._name);
    }

    const namespace =
      selector === ':root'
        ? []
        : this._namespace.concat({type: 'selector', scope: selector.trim()});

    return new MainDOMSource(
      this._rootElement$,
      this._sanitation$,
      namespace,
      this._isolateModule,
      this._eventDelegator,
      this._name
    ) as DOMSource;
  }

  public events<K extends keyof HTMLElementEventMap>(
    eventType: K,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): Stream<HTMLElementEventMap[K]>;
  public events(
    eventType: string,
    options: EventsFnOptions = {},
    bubbles?: boolean
  ): Stream<Event> {
    if (typeof eventType !== `string`) {
      throw new Error(
        `DOM driver's events() expects argument to be a ` +
          `string representing the event type to listen for.`
      );
    }
    const event$: Stream<Event> = this._eventDelegator.addEventListener(
      eventType,
      this._namespace,
      options,
      bubbles
    );

    const out: DevToolEnabledSource & Stream<Event> = adapt(event$);
    out._isCycleSource = this._name;
    return out;
  }

  public dispose(): void {
    this._sanitation$.shamefullySendNext(null);
    //this._isolateModule.reset();
  }

  // The implementation of these are in the constructor so that their `this`
  // references are automatically bound to the instance, so that library users
  // can do destructuring `const {isolateSource, isolateSink} = sources.DOM` and
  // not get bitten by a missing `this` reference.

  public isolateSource: (source: MainDOMSource, scope: string) => MainDOMSource;
  public isolateSink: IsolateSink<any>;
}
