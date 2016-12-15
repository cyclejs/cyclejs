import {DriverFunction} from '@cycle/run';
import {Stream} from 'xstream';
import {VNode} from './interfaces';
import {DOMSource} from './DOMSource';
import {HTMLSource} from './HTMLSource';
const toHTML: (vnode: VNode) => string = require('snabbdom-to-html');

export interface HTMLDriverOptions {
  transposition?: boolean;
}

export type EffectCallback = (html: string) => void;
const noop = () => {};

export function makeHTMLDriver(effect: EffectCallback, options?: HTMLDriverOptions) {
  if (!options) { options = {}; }
  const transposition = options.transposition || false;
  function htmlDriver(vnode$: Stream<VNode>, name: string): DOMSource {
    const html$ = vnode$.map(toHTML);
    html$.addListener({
      next: effect || noop,
      error: noop,
      complete: noop,
    });
    return new HTMLSource(html$, name);
  };
  return htmlDriver;
}
