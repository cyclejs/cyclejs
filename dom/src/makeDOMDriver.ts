import {Driver, FantasyObservable} from '@cycle/run';
import {init} from 'snabbdom';
import {Module} from 'snabbdom/modules/module';
import xs, {Stream, Listener} from 'xstream';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNode} from 'snabbdom/vnode';
import {toVNode} from 'snabbdom/tovnode';
import {VNodeWrapper} from './VNodeWrapper';
import {getValidNode, checkValidContainer} from './utils';
import defaultModules from './modules';
import {IsolateModule} from './IsolateModule';
import {EventDelegator} from './EventDelegator';
import * as MapPolyfill from 'es6-map';

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

const domReady$ = xs.create<null>({
  start(lis: Listener<null>) {
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => {
        const state = document.readyState;
        if (state === 'interactive' || state === 'complete') {
          lis.next(null);
          lis.complete();
        }
      });
    } else {
      lis.next(null);
      lis.complete();
    }
  },
  stop() {},
});

function makeDOMDriver(
  container: string | Element | DocumentFragment,
  options?: DOMDriverOptions,
): Driver<Stream<VNode>, MainDOMSource> {
  if (!options) {
    options = {};
  }
  checkValidContainer(container);
  const modules = options.modules || defaultModules;
  const isolateModule = new IsolateModule();
  const patch = init([isolateModule.createModule()].concat(modules));
  let vnodeWrapper: VNodeWrapper;
  const delegators = new MapPolyfill<string, EventDelegator>();
  makeDOMDriverInputGuard(modules);

  function DOMDriver(vnode$: Stream<VNode>, name = 'DOM'): MainDOMSource {
    domDriverInputGuard(vnode$);
    const sanitation$ = xs.create<null>();

    const firstRoot$ = domReady$.map(() => {
      const firstRoot = getValidNode(container) || document.body;
      vnodeWrapper = new VNodeWrapper(firstRoot);
      return firstRoot;
    });

    let tooEarlyWasConsumed = false;
    let latestRoot: Element | null = null;
    const tooEarlyRootElement$ = xs.create<Element>({
      start(lis: Listener<Element>) {
        if (latestRoot) {
          lis.next(latestRoot);
          tooEarlyWasConsumed = true;
        }
      },
      stop() {},
    });

    const rootElement$ = firstRoot$
      .map(
        firstRoot =>
          xs
            .merge(vnode$.endWhen(sanitation$), sanitation$)
            .map(vnode => vnodeWrapper.call(vnode))
            .fold(patch, toVNode(firstRoot))
            .drop(1)
            .map(unwrapElementFromVNode)
            .startWith(firstRoot as Element)
            .compose(dropCompletion), // don't complete this stream
      )
      .flatten();

    // Start the snabbdom patching, over time
    rootElement$.addListener({
      next: (el: Element) => {
        if (!tooEarlyWasConsumed) {
          latestRoot = el;
        }
      },
      error: reportSnabbdomError,
    });

    return new MainDOMSource(
      xs.merge(tooEarlyRootElement$, rootElement$).remember(),
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
