import {DriverFunction} from '@cycle/run';
import {init} from 'snabbdom';
import xs, {Stream} from 'xstream';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNode} from './interfaces';
import {VNodeWrapper} from './VNodeWrapper';
import {getElement} from './utils';
import defaultModules from './modules';
import {IsolateModule} from './isolateModule';
import {EventDelegator} from './EventDelegator';
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
}

function makeDOMDriver(container: string | Element, options?: DOMDriverOptions) {
  if (!options) { options = {}; }
  const modules = options.modules || defaultModules;
  const isolateModule = new IsolateModule();
  const patch = init([isolateModule.createModule()].concat(modules));
  const rootElement = getElement(container) || document.body;
  const vnodeWrapper = new VNodeWrapper(rootElement);
  const delegators = new MapPolyfill<string, EventDelegator>();
  makeDOMDriverInputGuard(modules);

  function DOMDriver(vnode$: Stream<VNode>, name = 'DOM'): DOMSource {
    domDriverInputGuard(vnode$);
    const sanitation$ = xs.create();
    const rootElement$ = xs.merge(vnode$.endWhen(sanitation$), sanitation$)
      .map(vnode => vnodeWrapper.call(vnode))
      .fold<VNode | Element>(patch, rootElement)
      .drop(1)
      .map(function unwrapElementFromVNode(vnode: VNode) { return vnode.elm; })
      .compose((stream: any) => xs.merge(stream, xs.never())) // don't complete this stream
      .startWith(rootElement);

    rootElement$.addListener({next: () => {}, error: () => {}, complete: () => {}});

    return new MainDOMSource(
      rootElement$,
      sanitation$,
      [],
      isolateModule,
      delegators,
      name,
    );
  };

  return DOMDriver;
}

export {makeDOMDriver}
