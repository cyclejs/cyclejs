import {StreamAdapter} from '@cycle/base';
import {init} from 'snabbdom';
import xs, {Stream} from 'xstream';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNode} from './interfaces';
import {VNodeWrapper} from './VNodeWrapper';
import {getElement} from './utils';
import defaultModules from './modules';
import {IsolateModule} from './isolateModule';
import {makeTransposeVNode} from './transposition';
import {EventDelegator} from './EventDelegator';
import xsSA from '@cycle/xstream-adapter';
let MapPolyfill: typeof Map = require('es6-map');

function makeDOMDriverInputGuard(modules: any) {
  if (!Array.isArray(modules)) {
    throw new Error(`Optional modules option must be ` +
     `an array for snabbdom modules`);
  }
}

function domDriverInputGuard(view$: Stream<VNode>): void {
  if (!view$
  || typeof view$.addListener !== `function`
  || typeof view$.fold !== `function`) {
    throw new Error(`The DOM driver function expects as input a Stream of ` +
      `virtual DOM elements`);
  }
}

export interface DOMDriverOptions {
  modules?: Array<Object>;
  transposition?: boolean;
}

function makeDOMDriver(container: string | Element, options?: DOMDriverOptions): Function {
  if (!options) { options = {}; }
  const transposition = options.transposition || false;
  const modules = options.modules || defaultModules;
  const isolateModule = new IsolateModule((new MapPolyfill<string, Element>()));
  const patch = init([isolateModule.createModule()].concat(modules));
  const rootElement = getElement(container);
  const vnodeWrapper = new VNodeWrapper(rootElement);
  const delegators = new MapPolyfill<string, EventDelegator>();
  makeDOMDriverInputGuard(modules);

  function DOMDriver(vnode$: Stream<VNode>, runStreamAdapter: StreamAdapter, name: string): DOMSource {
    domDriverInputGuard(vnode$);
    const transposeVNode = makeTransposeVNode(runStreamAdapter);
    const preprocessedVNode$ = (
      transposition ? vnode$.map(transposeVNode).flatten() : vnode$
    );
    const rootElement$ = preprocessedVNode$
      .map(vnode => vnodeWrapper.call(vnode))
      .fold<VNode>(<(acc: VNode, v: VNode) => VNode>patch, <VNode> rootElement)
      .drop(1)
      .map(function unwrapElementFromVNode(vnode: VNode) { return vnode.elm; })
      .compose(stream => xs.merge(stream, xs.never())) // don't complete this stream
      .startWith(rootElement);

    /* tslint:disable:no-empty */
    rootElement$.addListener({next: () => {}, error: () => {}, complete: () => {}});
    /* tslint:enable:no-empty */

    return new MainDOMSource(rootElement$, runStreamAdapter, [], isolateModule, delegators, name);
  };

  (<any> DOMDriver).streamAdapter = xsSA;

  return DOMDriver;
}

export {makeDOMDriver}
