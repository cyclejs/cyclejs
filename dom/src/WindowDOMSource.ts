import xs, {Stream, MemoryStream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {DevToolEnabledSource} from '@cycle/run';
import {EventsFnOptions} from './DOMSource';
import {fromEvent} from './fromEvent';

export class WindowDOMSource {
  constructor(private _name: string) {}

  public select(selector: string): WindowDOMSource {
    // This functionality is still undefined/undecided.
    return this;
  }

  public elements(): MemoryStream<Array<Window>> {
    const out: DevToolEnabledSource & MemoryStream<Array<Window>> = adapt(
      xs.of([window])
    );
    out._isCycleSource = this._name;
    return out;
  }

  public element(): MemoryStream<Window> {
    const out: DevToolEnabledSource & MemoryStream<Window> = adapt(
      xs.of(window)
    );
    out._isCycleSource = this._name;
    return out;
  }

  public events<K extends keyof WindowEventMap>(
    eventType: K,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): Stream<WindowEventMap[K]>;
  public events(
    eventType: string,
    options: EventsFnOptions = {},
    bubbles?: boolean
  ): Stream<Event> {
    const stream = fromEvent(
      window,
      eventType,
      options.useCapture,
      options.preventDefault
    );

    const out: DevToolEnabledSource & Stream<Event> = adapt(stream);
    out._isCycleSource = this._name;
    return out;
  }
}
