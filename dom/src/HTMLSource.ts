import xs, {Stream} from 'xstream';
import {VNode} from 'snabbdom';
import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
const toHTML: (vnode: VNode) => string = require('snabbdom-to-html');

export class HTMLSource {
  private _html$: any;
  private _empty$: any;

  constructor(vnode$: Stream<VNode>,
              private runStreamAdapter: StreamAdapter) {
    this._html$ = vnode$.last().map(toHTML);
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
