import {Driver, FantasyObservable} from '@cycle/run';
import {init} from 'snabbdom';
import {Module} from 'snabbdom/modules/module';
import xs, {Stream, Listener} from 'xstream';
import concat from 'xstream/extra/concat';
import sampleCombine from 'xstream/extra/sampleCombine';
import {DOMSource} from './DOMSource';
import {MainDOMSource} from './MainDOMSource';
import {VNode} from 'snabbdom/vnode';
import {toVNode} from 'snabbdom/tovnode';
import {VNodeWrapper} from './VNodeWrapper';
import {getValidNode, checkValidContainer} from './utils';
import defaultModules from './modules';
import {IsolateModule} from './IsolateModule';
import {EventDelegator} from './EventDelegator';

function makeDOMDriverInputGuard(modules: any) {
  if (!Array.isArray(modules)) {
    throw new Error(
      `Optional modules option must be an array for snabbdom modules`
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
        `virtual DOM elements`
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

function makeDOMReady$(): Stream<null> {
  return xs.create<null>({
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
}

function addRootScope(vnode: VNode): VNode {
  vnode.data = vnode.data || {};
  vnode.data.isolate = [];
  return vnode;
}

function makeDOMDriver(
  container: string | Element | DocumentFragment,
  options?: DOMDriverOptions
): Driver<Stream<VNode>, MainDOMSource> {
  if (!options) {
    options = {};
  }
  checkValidContainer(container);
  const modules = options.modules || defaultModules;
  makeDOMDriverInputGuard(modules);
  const isolateModule = new IsolateModule();
  const patch = init([isolateModule.createModule()].concat(modules));
  const domReady$ = makeDOMReady$();
  let vnodeWrapper: VNodeWrapper;
  let mutationObserver: MutationObserver;
  const mutationConfirmed$ = xs.create<null>({
    start(listener) {
      mutationObserver = new MutationObserver(() => listener.next(null));
    },
    stop() {
      mutationObserver.disconnect();
    },
  });

  function DOMDriver(vnode$: Stream<VNode>, name = 'DOM'): MainDOMSource {
    domDriverInputGuard(vnode$);
    const sanitation$ = xs.create<null>();

    const firstRoot$ = domReady$.map(() => {
      const firstRoot = getValidNode(container) || document.body;
      vnodeWrapper = new VNodeWrapper(firstRoot);
      return firstRoot;
    });

    // We need to subscribe to the sink (i.e. vnode$) synchronously inside this
    // driver, and not later in the map().flatten() because this sink is in
    // reality a SinkProxy from @cycle/run, and we don't want to miss the first
    // emission when the main() is connected to the drivers.
    // Read more in issue #739.
    const rememberedVNode$ = vnode$.remember();
    rememberedVNode$.addListener({});

    // The mutation observer internal to mutationConfirmed$ should
    // exist before elementAfterPatch$ calls mutationObserver.observe()
    mutationConfirmed$.addListener({});

    const elementAfterPatch$ = firstRoot$
      .map(
        firstRoot =>
          xs
            .merge(rememberedVNode$.endWhen(sanitation$), sanitation$)
            .map(vnode => vnodeWrapper.call(vnode))
            .startWith(addRootScope(toVNode(firstRoot)))
            .fold(patch, toVNode(firstRoot))
            .drop(1)
            .map(unwrapElementFromVNode)
            .startWith(firstRoot as any)
            .map(el => {
              mutationObserver.observe(el, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true,
                attributeOldValue: true,
                characterDataOldValue: true,
              });
              return el;
            })
            .compose(dropCompletion) // don't complete this stream
      )
      .flatten();

    const rootElement$ = concat(domReady$, mutationConfirmed$)
      .endWhen(sanitation$)
      .compose(sampleCombine(elementAfterPatch$))
      .map(arr => arr[1])
      .remember();

    // Start the snabbdom patching, over time
    rootElement$.addListener({error: reportSnabbdomError});

    const delegator = new EventDelegator(rootElement$, isolateModule);

    return new MainDOMSource(
      rootElement$,
      sanitation$,
      [],
      isolateModule,
      delegator,
      name
    );
  }

  return DOMDriver as any;
}

export {makeDOMDriver};
