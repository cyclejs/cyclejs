import {Driver, FantasyObservable} from '@cycle/run';
import {init} from 'snabbdom';
import {Module} from 'snabbdom/modules/module';
import xs, {Stream} from 'xstream';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNode} from 'snabbdom/vnode';
import {toVNode} from 'snabbdom/tovnode';
import {VNodeWrapper} from './VNodeWrapper';
import {getValidNode} from './utils';
import defaultModules from './modules';
import {IsolateModule} from './IsolateModule';
import {EventDelegator} from './EventDelegator';
const MapPolyfill: typeof Map = require('es6-map');

function makeDOMDriverInputGuard(modules: any) {
  if (!Array.isArray(modules)) {
    throw new Error(
      `Optional modules option must be ` + `an array for snabbdom modules`,
    );
  }
}

function domDriverInputGuard(view$: Stream<VNode>): void {
  if (
    !view$ ||
    typeof view$.addListener !== `function` ||
    typeof view$.fold !== `function`
  ) {
    throw new Error(
      `The DOM driver function expects as input a Stream of ` +
        `virtual DOM elements`,
    );
  }
}

export interface DOMDriverOptions {
  modules?: Array<Module>;
}

function dropCompletion<T>(input: Stream<T>): Stream<T> {
  return xs.merge(input, xs.never());
}

function unwrapElementFromVNode(vnode: VNode): Element {
  return vnode.elm as Element;
}

function reportSnabbdomError(err: any): void {
  (console.error || console.log)(err);
}

function makeDOMDriver(
  container: string | Element | DocumentFragment,
  options?: DOMDriverOptions,
): Driver<Stream<VNode>, MainDOMSource> {
  if (!options) {
    options = {};
  }
  const modules = options.modules || defaultModules;
  const isolateModule = new IsolateModule();
  const patch = init([isolateModule.createModule()].concat(modules));
  const rootElement = getValidNode(container) || document.body;
  const vnodeWrapper = new VNodeWrapper(rootElement);
  const delegators = new MapPolyfill<string, EventDelegator>();
  makeDOMDriverInputGuard(modules);

  function DOMDriver(vnode$: Stream<VNode>, name = 'DOM'): MainDOMSource {
    domDriverInputGuard(vnode$);
    const sanitation$ = xs.create<null>();
    const rootElement$ = xs
      .merge(vnode$.endWhen(sanitation$), sanitation$)
      .map(vnode => vnodeWrapper.call(vnode))
      .fold(patch, toVNode(rootElement))
      .drop(1)
      .map(unwrapElementFromVNode)
      .compose(dropCompletion) // don't complete this stream
      .startWith(rootElement as any);

    // Start the snabbdom patching, over time
    const listener = {error: reportSnabbdomError};
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
          rootElement$.addListener(listener);
        }
      });
    } else {
      rootElement$.addListener(listener);
    }

    return new MainDOMSource(
      rootElement$,
      sanitation$,
      [],
      isolateModule,
      delegators,
      name,
    );
  }

  return DOMDriver as any;
}

export {makeDOMDriver};
