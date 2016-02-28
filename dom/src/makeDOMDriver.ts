import {init} from 'snabbdom';
import {Observable} from 'rx';
import {DOMSource} from './DOMSource';
import {VNodeWrapper} from './VNodeWrapper';
import {domSelectorParser} from './utils';
import defaultModules from './modules';
import {transposeVTree} from './transposition';

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

interface DOMDriverOptions {
  modules: Object;
  onError(msg: string): void;
}

const defaults = {
  modules: defaultModules,
  onError: defaultOnErrorFn,
};

function defaultOnErrorFn(msg: string): void {
  if (console && console.error) {
    console.error(msg);
  } else {
    console.log(msg);
  }
}

function makeDOMDriver(container: string | Element, {
  modules = defaultModules,
  onError = defaultOnErrorFn,
} = defaults) {
  const patch = init(modules);
  const rootElement = domSelectorParser(container);
  const vnodeWrapper = new VNodeWrapper(rootElement);
  makeDOMDriverInputGuard(modules, onError);

  return function DOMDriver(view$: Observable<any>) {
    domDriverInputGuard(view$);

    const rootElement$ = view$
      .flatMapLatest(transposeVTree)
      .map(vnodeWrapper.call, vnodeWrapper)
      .scan(patch, rootElement)
      .map(({elm}) => elm)
      .doOnError(onError)
      .replay(null, 1);

    const disposable = rootElement$.connect();

    return new DOMSource(rootElement$, [], disposable);
  };
}

export {makeDOMDriver}
