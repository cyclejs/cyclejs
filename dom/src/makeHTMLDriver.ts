import XStreamAdapter from '@cycle/xstream-adapter';
import {StreamAdapter} from '@cycle/base';
import {Stream} from 'xstream';
import {VNode} from 'snabbdom';
import {makeTransposeVNode} from './transposition';
import {HTMLDriverOptions, HTMLSource} from './HTMLSource';

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
