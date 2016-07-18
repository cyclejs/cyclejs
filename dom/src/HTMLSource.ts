import xs, {Stream} from 'xstream';
import {StreamAdapter} from '@cycle/base';
import {DOMSource, EventsFnOptions} from './DOMSource';
import xsSA from '@cycle/xstream-adapter';

export class HTMLSource implements DOMSource {
  private _html$: any;
  private _empty$: any;

  constructor(html$: Stream<string>,
              private runSA: StreamAdapter) {
    this._html$ = html$;
    this._empty$ = runSA.adapt(xs.empty(), xsSA.streamSubscribe);
  }

  elements(): any {
    return this.runSA.adapt(this._html$, xsSA.streamSubscribe);
  }

  public select(selector: string): DOMSource {
    return new HTMLSource(xs.empty(), this.runSA);
  }

  public events(eventType: string, options?: EventsFnOptions): any {
    return this._empty$;
  }
}
