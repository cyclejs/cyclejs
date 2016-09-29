import xs, {Stream} from 'xstream';
import xsAdapter from '@cycle/xstream-adapter';
import {DevToolEnabledSource} from '@cycle/base';
import {DOMSource} from './DOMSource';
import {DOMSourceOptions} from './DOMSourceOptions';
import {EventsFnOptions} from './EventsFnOptions';
import {fromEvent} from './fromEvent';

export class DocumentDOMSource extends DOMSource {
  constructor(options: DOMSourceOptions) {
    super(options);
  }

  elements(): any {
    const runStreamAdapter = this._runStreamAdapter;
    const out: DevToolEnabledSource = runStreamAdapter.remember(
      runStreamAdapter.adapt(xs.of(document), xsAdapter.streamSubscribe)
    );
    out._isCycleSource = this._driverKey;

    return out;
  }

  select(selector: string): DOMSource {
    // @TODO Decide what should happen.
    return this;
  }

  events(eventType: string, options: EventsFnOptions = {}): DevToolEnabledSource {
    let stream: Stream<Event>;
    if (options && typeof options.useCapture === 'boolean') {
      stream = fromEvent(document, eventType, options.useCapture);
    } else {
      stream = fromEvent(document, eventType);
    }
    const out: DevToolEnabledSource = this._runStreamAdapter.adapt(
      stream,
      xsAdapter.streamSubscribe
    );
    out._isCycleSource = this._driverKey;

    return out;
  }
}
