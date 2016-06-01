import {StreamAdapter} from '@cycle/base';
import {init} from 'snabbdom';
import xs, {Stream} from 'xstream';
import concat from 'xstream/extra/concat';
import {DOMSource} from './DOMSource';
import {VNode} from './interfaces';
import {VNodeWrapper} from './VNodeWrapper';
import {getElement} from './utils';
import defaultModules from './modules';
import {IsolateModule} from './isolateModule';
import {makeTransposeVNode} from './transposition';
import {EventDelegator} from './EventDelegator';
import XStreamAdapter from '@cycle/xstream-adapter';

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
  const isolateModule = new IsolateModule((<Map<string, Element>>new Map()));
  const patch = init([isolateModule.createModule()].concat(modules));
  const rootElement = getElement(container);
  const vnodeWrapper = new VNodeWrapper(rootElement);
  const delegators = new Map<string, EventDelegator>();
  makeDOMDriverInputGuard(modules);

  function DOMDriver(vnode$: Stream<VNode>, runStreamAdapter: StreamAdapter): DOMSource {
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
      .startWith(rootElement)
      .compose(stream => concat(stream, xs.never())) // don't complete this stream
      .remember();

    /* tslint:disable:no-empty */
    rootElement$.addListener({next: () => {}, error: () => {}, complete: () => {}});
    /* tslint:enable:no-empty */

    return new DOMSource(rootElement$, runStreamAdapter, [], isolateModule, delegators);
  };

  (<any> DOMDriver).streamAdapter = XStreamAdapter;

  return DOMDriver;
}

export {makeDOMDriver}
