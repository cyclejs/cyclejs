import XStreamAdapter from '@cycle/xstream-adapter';
import {StreamAdapter} from '@cycle/base';
import xs, {Stream} from 'xstream';
import {VNode} from 'snabbdom';
import {makeTransposeVNode} from './transposition';
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

export function makeHTMLDriver(options?: HTMLDriverOptions) {
  if (!options) { options = {}; }
  const transposition = options.transposition || false;
  function htmlDriver(vnode$: Stream<VNode>, runStreamAdapter: StreamAdapter): any {
    const transposeVNode = makeTransposeVNode(runStreamAdapter);
    const preprocessedVNode$ = (
      transposition ? vnode$.map(transposeVNode).flatten() : vnode$
    );
    return new HTMLSource(preprocessedVNode$, runStreamAdapter);
  };
  (<any> htmlDriver).streamAdapter = XStreamAdapter;
  return htmlDriver;
}
