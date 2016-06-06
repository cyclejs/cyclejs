import xs, {Stream} from 'xstream';
import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';

export class HTMLSource {
  private _html$: any;
  private _empty$: any;

  constructor(html$: Stream<string>,
              private runStreamAdapter: StreamAdapter) {
    this._html$ = html$;
    this._empty$ = runStreamAdapter.adapt(xs.empty(), XStreamAdapter.streamSubscribe);
  }

  get elements(): any {
    return this.runStreamAdapter.adapt(this._html$, XStreamAdapter.streamSubscribe);
  }

  public select(): HTMLSource {
    return new HTMLSource(xs.empty(), this.runStreamAdapter);
  }

  public events(): any {
    return this._empty$;
  }
}

export interface HTMLDriverOptions {
  transposition?: boolean;
}
