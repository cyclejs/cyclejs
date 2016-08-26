import xs, {Stream} from 'xstream';
import xsSA from '@cycle/xstream-adapter';
import {StreamAdapter, DevToolEnabledSource} from '@cycle/base';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {fromEvent} from './fromEvent';

export class BodyDOMSource implements DOMSource {
  constructor(private _runStreamAdapter: StreamAdapter, private _name: string) {
  }

  select(selector: string): DOMSource {
    // This functionality is still undefined/undecided.
    return this;
  }

  elements(): any {
    const runSA = this._runStreamAdapter;
    const out: DevToolEnabledSource = runSA.remember(
      runSA.adapt(xs.of(document.body), xsSA.streamSubscribe)
    );
    out._isCycleSource = this._name;
    return out;
  }

  events(eventType: string, options: EventsFnOptions = {}): any {
    let stream: Stream<Event>;
    if (options && typeof options.useCapture === 'boolean') {
      stream = fromEvent(document.body, eventType, options.useCapture);
    } else {
      stream = fromEvent(document.body, eventType);
    }
    const out: DevToolEnabledSource = this._runStreamAdapter.adapt(
      stream,
      xsSA.streamSubscribe
    );
    out._isCycleSource = this._name;
    return out;
  }
}
