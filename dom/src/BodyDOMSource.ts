import xs, {Stream, MemoryStream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {DevToolEnabledSource} from '@cycle/run';
import {EventsFnOptions, DOMSource} from './DOMSource';
import {fromEvent} from './fromEvent';

export class BodyDOMSource {
  constructor(private _name: string) {}

  public select(selector: string): BodyDOMSource {
    // This functionality is still undefined/undecided.
    return this;
  }

  public elements(): MemoryStream<Array<HTMLBodyElement>> {
    const out: DevToolEnabledSource &
      MemoryStream<Array<HTMLBodyElement>> = adapt(xs.of([document.body]));
    out._isCycleSource = this._name;
    return out;
  }

  public element(): MemoryStream<HTMLBodyElement> {
    const out: DevToolEnabledSource & MemoryStream<HTMLBodyElement> = adapt(
      xs.of(document.body)
    );
    out._isCycleSource = this._name;
    return out;
  }

  public events<K extends keyof HTMLBodyElementEventMap>(
    eventType: K,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): Stream<HTMLBodyElementEventMap[K]>;
  public events(
    eventType: string,
    options: EventsFnOptions = {},
    bubbles?: boolean
  ): Stream<Event> {
    let stream: Stream<Event>;

    stream = fromEvent(
      document.body,
      eventType,
      options.useCapture,
      options.preventDefault
    );

    const out: DevToolEnabledSource & Stream<Event> = adapt(stream);
    out._isCycleSource = this._name;
    return out;
  }
}
