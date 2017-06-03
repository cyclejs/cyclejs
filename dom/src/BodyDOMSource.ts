import xs, {Stream, MemoryStream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {DevToolEnabledSource} from '@cycle/run';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {fromEvent} from './fromEvent';

export class BodyDOMSource implements DOMSource {
  constructor(private _name: string) {}

  public select(selector: string): DOMSource {
    // This functionality is still undefined/undecided.
    return this;
  }

  public elements(): MemoryStream<HTMLBodyElement> {
    const out: DevToolEnabledSource & MemoryStream<HTMLBodyElement> = adapt(
      xs.of(document.body),
    );
    out._isCycleSource = this._name;
    return out;
  }

  public events(
    eventType: string,
    options: EventsFnOptions = {},
  ): Stream<Event> {
    let stream: Stream<Event>;

    stream = fromEvent(
      document.body,
      eventType,
      options.useCapture,
      options.preventDefault,
    );

    const out: DevToolEnabledSource & Stream<Event> = adapt(stream);
    out._isCycleSource = this._name;
    return out;
  }
}
