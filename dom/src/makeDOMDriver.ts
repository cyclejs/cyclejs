import {StreamAdapter} from '@cycle/base';
import {init as initSnabbdom} from 'snabbdom';
import xs, {Stream} from 'xstream';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNode} from './interfaces';
import {VNodeWrapper} from './VNodeWrapper';
import {getElement} from './utils';
import defaultModules from './modules';
import {ModuleIsolator} from './ModuleIsolator';
import {makeTransposeVNode} from './transposition';
import {EventDelegator} from './EventDelegator';
import xsAdapter from '@cycle/xstream-adapter';
let MapPolyfill: typeof Map = require('es6-map');

function noop(): void {}

function makeDOMDriverModulesGuard(modules: any) {
  if (!Array.isArray(modules)) {
    throw new Error(`Optional modules option must be ` +
     `an array for snabbdom modules`);
  }
}

function domDriverVNodeStreamGuard(vnode$: Stream<VNode>): void {
  if (!vnode$
    || typeof vnode$.addListener !== `function`
    || typeof vnode$.fold !== `function`) {
    throw new Error(`The DOM driver function expects as input a Stream of ` +
      `virtual DOM elements`);
  }
}

export interface DOMDriverOptions {
  modules?: Array<Object>;
  transposition?: boolean;
}

function makeDOMDriver(container: string | Element, options: DOMDriverOptions = {}): Function {
  const transposition = options.transposition || false;
  const modules = options.modules || defaultModules;

  makeDOMDriverModulesGuard(modules);

  const moduleIsolator = new ModuleIsolator(new MapPolyfill<string, Element>());
  const patch = initSnabbdom([moduleIsolator.createModule()].concat(modules));
  const rootElement = getElement(container);
  const vnodeWrapper = new VNodeWrapper(rootElement);
  const eventDelegators = new MapPolyfill<string, EventDelegator>();

  function DOMDriver(vnode$: Stream<VNode>, runStreamAdapter: StreamAdapter, name: string): DOMSource {
    domDriverVNodeStreamGuard(vnode$);

    const transposeVNode = makeTransposeVNode(runStreamAdapter);
    const preprocessedVNode$ = (
      transposition ? vnode$.map(transposeVNode).flatten() : vnode$
    );
    const sanitation$ = xs.create();
    const rootElement$ = xs.merge(preprocessedVNode$.endWhen(sanitation$), sanitation$)
      .map(vnode => vnodeWrapper.call(vnode))
      .fold<VNode>(<(acc: VNode, vnode: VNode) => VNode>patch, <VNode> rootElement)
      .drop(1)
      .map(function unwrapElementFromVNode(vnode: VNode) { return vnode.elm; })
      // @TODO We need a test for the necessity of incomplete stream.
      .compose(stream => xs.merge(stream, xs.never()))
      .startWith(rootElement);

    rootElement$.addListener({next: noop, error: noop, complete: noop});

    return new MainDOMSource(rootElement$, sanitation$, runStreamAdapter, [], moduleIsolator, eventDelegators, name);
  }

  (<any> DOMDriver).streamAdapter = xsAdapter;

  return DOMDriver;
}

export {makeDOMDriver}
