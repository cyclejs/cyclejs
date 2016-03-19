import {Observable} from 'rx';
import {VNode} from 'snabbdom';
import {transposeVTree} from './transposition';
const toHTML: (vnode: VNode) => string = require('snabbdom-to-html');

function makeBogusSelect() {
  return function select() {
    return {
      observable: Observable.empty(),
      events() {
        return Observable.empty();
      },
    };
  };
}

export interface HTMLDriverOptions {
  transposition?: boolean;
}

export function makeHTMLDriver(options?: HTMLDriverOptions) {
  if (!options) { options = {}; }
  const transposition = options.transposition || false;
  return function htmlDriver(vnode$: Observable<VNode>): Observable<string> {
    const goodVNode$ = (
      transposition ? vnode$.flatMapLatest(transposeVTree) : vnode$
    );
    const output$ = goodVNode$.last().map(toHTML);
    (<any> output$).select = makeBogusSelect();
    return output$;
  };
}
