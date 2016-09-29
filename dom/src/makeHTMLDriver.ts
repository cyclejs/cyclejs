import xsSA from '@cycle/xstream-adapter';
import {StreamAdapter} from '@cycle/base';
import {Stream} from 'xstream';
import {VNode} from './interfaces';
import {makeTransposeVNode} from './transposition';
import {DOMSource} from './DOMSource';
import {HTMLSource} from './HTMLSource';
const toHTML: (vnode: VNode) => string = require('snabbdom-to-html');

export interface HTMLDriverOptions {
  transposition?: boolean;
}

export type EffectCallback = (html: string) => void;
/* tslint:disable:no-empty */
const noop = () => {};
/* tslint:enable:no-empty */

export function makeHTMLDriver(effect: EffectCallback, options?: HTMLDriverOptions) {
  if (!options) { options = {}; }
  const transposition = options.transposition || false;
  function htmlDriver(vnode$: Stream<VNode>, runStreamAdapter: StreamAdapter, driverKey: string): DOMSource {
    const transposeVNode = makeTransposeVNode(runStreamAdapter);
    const preprocessedVNode$ = (
      transposition ? vnode$.map(transposeVNode).flatten() : vnode$
    );
    const html$ = preprocessedVNode$.map(toHTML);
    html$.addListener({
      next: effect || noop,
      error: noop,
      complete: noop,
    });

    return new HTMLSource({html$, runStreamAdapter, driverKey});
  };
  (<any> htmlDriver).streamAdapter = xsSA;
  return htmlDriver;
}
