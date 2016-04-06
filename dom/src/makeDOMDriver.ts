import {StreamAdapter} from '@cycle/base';
import {init} from 'snabbdom';
import {Observable} from 'rx';
import {DOMSource} from './DOMSource';
import {VNodeWrapper} from './VNodeWrapper';
import {domSelectorParser} from './utils';
import defaultModules from './modules';
import {makeTransposeVNode} from './transposition';
import RxAdapter from '@cycle/rx-adapter';

function makeDOMDriverInputGuard(modules: any, onError: any) {
  if (!Array.isArray(modules)) {
    throw new Error(`Optional modules option must be ` +
     `an array for snabbdom modules`);
  }
  if (typeof onError !== `function`) {
    throw new Error(`You provided an \`onError\` to makeDOMDriver but it was ` +
      `not a function. It should be a callback function to handle errors.`);
  }
}

function domDriverInputGuard(view$: Observable<any>): void {
  if (!view$ || typeof view$.subscribe !== `function`) {
    throw new Error(`The DOM driver function expects as input an ` +
      `Observable of virtual DOM elements`);
  }
}

export interface DOMDriverOptions {
  modules?: Object;
  onError?(msg: string): void;
  transposition?: boolean;
}

function defaultOnErrorFn(msg: string): void {
  if (console && console.error) {
    console.error(msg);
  } else {
    console.log(msg);
  }
}

function makeDOMDriver(container: string | Element, options?: DOMDriverOptions): Function {
  if (!options) { options = {}; }
  const transposition = options.transposition || false;
  const modules = options.modules || defaultModules;
  const onError = options.onError || defaultOnErrorFn;
  const patch = init(modules);
  const rootElement = domSelectorParser(container);
  const vnodeWrapper = new VNodeWrapper(rootElement);
  makeDOMDriverInputGuard(modules, onError);

  function DOMDriver(vnode$: Observable<any>, runStreamAdapter: StreamAdapter): DOMSource {
    domDriverInputGuard(vnode$);
    const transposeVNode = makeTransposeVNode(runStreamAdapter);
    const preprocessedVNode$ = (
      transposition ? vnode$.flatMapLatest(transposeVNode) : vnode$
    );
    const rootElement$ = preprocessedVNode$
      .map(vnodeWrapper.call, vnodeWrapper)
      .scan(patch, rootElement)
      .map(({elm}) => elm)
      .startWith(rootElement)
      .doOnError(onError)
      .replay(null, 1);

    const disposable = rootElement$.connect();

    return new DOMSource(rootElement$, runStreamAdapter, [], disposable);
  };

  (<any> DOMDriver).streamAdapter = RxAdapter;

  return DOMDriver;
}

export {makeDOMDriver}
