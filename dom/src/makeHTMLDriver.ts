import XStreamAdapter from '@cycle/xstream-adapter';
import {StreamAdapter} from '@cycle/base';
import {Stream} from 'xstream';
import {VNode} from './interfaces';
import {makeTransposeVNode} from './transposition';
import {HTMLDriverOptions, HTMLSource} from './HTMLSource';
const toHTML: (vnode: VNode) => string = require('snabbdom-to-html');

export type EffectCallback = (html: string) => void;
/* tslint:disable:no-empty */
const noop = () => {};
/* tslint:enable:no-empty */

export function makeHTMLDriver(effect: EffectCallback, options?: HTMLDriverOptions) {
  if (!options) { options = {}; }
  const transposition = options.transposition || false;
  function htmlDriver(vnode$: Stream<VNode>, runStreamAdapter: StreamAdapter): any {
    const transposeVNode = makeTransposeVNode(runStreamAdapter);
    const preprocessedVNode$ = (
      transposition ? vnode$.map(transposeVNode).flatten() : vnode$
    );
    const html$ = preprocessedVNode$.last().map(toHTML);
    html$.addListener({
      next: effect || noop,
      error: noop,
      complete: noop,
    });
    return new HTMLSource(html$, runStreamAdapter);
  };
  (<any> htmlDriver).streamAdapter = XStreamAdapter;
  return htmlDriver;
}
