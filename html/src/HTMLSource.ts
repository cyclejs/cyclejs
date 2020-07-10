import xs, {Stream, MemoryStream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {DevToolEnabledSource} from '@cycle/run';
import {EventsFnOptions} from '@cycle/dom';

export class HTMLSource {
  private _html$: Stream<string>;
  private _empty$: Stream<any>;

  constructor(html$: Stream<string>, private _name: string) {
    this._html$ = html$;
    this._empty$ = adapt(xs.empty());
  }

  public elements(): MemoryStream<string> {
    const out: DevToolEnabledSource & MemoryStream<string> = adapt(this._html$);
    out._isCycleSource = this._name;
    return out;
  }

  public element(): MemoryStream<string> {
    return this.elements();
  }

  public select(selector: string): HTMLSource {
    return new HTMLSource(xs.empty(), this._name);
  }

  public events(eventType: string, options?: EventsFnOptions): Stream<any> {
    const out: Partial<DevToolEnabledSource> & Stream<any> = this._empty$;
    out._isCycleSource = this._name;
    return out;
  }
}
