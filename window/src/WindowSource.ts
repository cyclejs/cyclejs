import {adapt} from '@cycle/run/lib/adapt';
import {DevToolEnabledSource} from '@cycle/run';
import {Stream} from 'xstream';
import {fromEvent, WindowEventOptions} from './fromEvent';

export class WindowSource {
  constructor(private _window: Window, private _name: string) {}

  public events<K extends keyof WindowEventMap>(
    eventType: K,
    options?: WindowEventOptions
  ): Stream<WindowEventMap[K]>;
  public events(eventType: string, options?: WindowEventOptions): Stream<Event>;
  public events(
    eventType: string,
    options: WindowEventOptions = {}
  ): Stream<Event> {
    const stream = fromEvent(this._window, eventType, options);
    const output: DevToolEnabledSource & Stream<Event> = adapt(stream);
    output._isCycleSource = this._name;
    return output;
  }
}
