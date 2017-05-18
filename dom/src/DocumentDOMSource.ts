import xs, {Stream, MemoryStream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {DevToolEnabledSource} from '@cycle/run';
import {DOMSource, EventsFnOptions, Predicate} from './DOMSource';
import {fromEvent} from './fromEvent';

export class DocumentDOMSource implements DOMSource {
  constructor(private _name: string) {
  }

  public select(selector: string): DOMSource {
    // This functionality is still undefined/undecided.
    return this;
  }

  public elements(): MemoryStream<Document> {
    const out: DevToolEnabledSource & MemoryStream<Document> =
      adapt(xs.of(document));
    out._isCycleSource = this._name;
    return out;
  }

  public events(eventType: string, options: EventsFnOptions = {}): Stream<Event> {
    let stream: Stream<Event>;
    if (options && typeof options.useCapture === 'boolean') {
      stream = fromEvent(document, eventType, options.useCapture);
    } else {
      stream = fromEvent(document, eventType);
    }
    if (options && typeof options.preventDefault !== 'undefined') {
      let cond : Predicate = options.preventDefault as Predicate;
      if (typeof options.preventDefault === 'boolean') {
        cond = (() => options.preventDefault) as Predicate;
      }
      stream = stream.map(ev => {
        if (cond(ev)) {
          ev.preventDefault();
        }
        return ev;
      });
    }
    const out: DevToolEnabledSource & Stream<Event> = adapt(stream);
    out._isCycleSource = this._name;
    return out;
  }
}
