import {Driver} from '@cycle/run';
import {Stream} from 'xstream';
import {VNode} from 'snabbdom/vnode';
import {HTMLSource} from './HTMLSource';
const init: Init = require('snabbdom-to-html/init');
const modulesForHTML: ModulesForHTML = require('snabbdom-to-html/modules');

type Init = (modules: Array<Module>) => ((vnode: VNode) => string);

interface ModulesForHTML {
  attributes: Module;
  props: Module;
  class: Module;
  style: Module;
}

export type Module = (vnode: VNode, attributes: Map<string, any>) => void;

const defaultModules = [
  modulesForHTML.attributes,
  modulesForHTML.props,
  modulesForHTML.class,
  modulesForHTML.style,
];

export interface HTMLDriverOptions {
  modules?: Array<Module>;
}

export type EffectCallback = (html: string) => void;
const noop = () => {};

export function makeHTMLDriver(
  effect: EffectCallback,
  options?: HTMLDriverOptions,
): Driver<Stream<VNode>, HTMLSource> {
  if (!options) {
    options = {};
  }
  const modules = options.modules || defaultModules;
  const toHTML = init(modules);
  function htmlDriver(vnode$: Stream<VNode>, name: string): HTMLSource {
    const html$ = vnode$.map(toHTML);
    html$.addListener({
      next: effect || noop,
      error: noop,
      complete: noop,
    });
    return new HTMLSource(html$, name);
  }
  return htmlDriver as any;
}
