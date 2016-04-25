import RxAdapter from '@cycle/rx-adapter';
import {StreamAdapter} from '@cycle/base';
import {Observable} from 'rx';
import {VNode} from 'snabbdom';
import {makeTransposeVNode} from './transposition';
const toHTML: (vnode: VNode) => string = require('snabbdom-to-html');

export class HTMLSource {
  public elements: any;
  private _empty$: any;

  constructor(vnode$: Observable<VNode>,
              private runStreamAdapter: StreamAdapter) {
    this.elements = vnode$.last().map(toHTML);
    this._empty$ = runStreamAdapter.adapt(Observable.empty(), RxAdapter.streamSubscribe);
  }

  public select(): HTMLSource {
    return new HTMLSource(Observable.empty(), this.runStreamAdapter);
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
  function htmlDriver(vnode$: Observable<VNode>, runStreamAdapter: StreamAdapter): any {
    const transposeVNode = makeTransposeVNode(runStreamAdapter);
    const preprocessedVNode$ = (
      transposition ? vnode$.flatMapLatest(transposeVNode) : vnode$
    );
    return new HTMLSource(preprocessedVNode$, runStreamAdapter);
  };
  (<any> htmlDriver).streamAdapter = RxAdapter;
  return htmlDriver;
}
