import xs, {Stream, MemoryStream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {DevToolEnabledSource} from '@cycle/run';
import {fromEvent} from './fromEvent';

//unimplemented
type windowSize = {
  width: number;
  height: number;
};
function windowSize(): windowSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export class WindowSource {
  constructor(private _name: string) {}

  public select(selector: string) {
    // This functionality is still undefined/undecided.
    return this;
  }

  public events<K extends keyof HTMLBodyElementEventMap>(
    eventType: K
  ): Stream<HTMLBodyElementEventMap[K]> {
    let stream;
    stream = fromEvent(window, eventType);
    const out: DevToolEnabledSource & Stream<Event> = adapt(stream);
    out._isCycleSource = this._name;
    return out;
  }
}

function windowDriver(sink?: any): any {
  return new WindowSource('Window');
}

export {windowDriver};
