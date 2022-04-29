import { Module } from 'snabbdom';
import { ScopeValue, Scope } from './types';
import { makeDomApi } from './api';
import { DomDriver } from './driver';

export { h, thunk, VNode } from 'snabbdom';
export { defaultModules } from './driver';
export { DomApi } from './api';
export {
  makeMockDomPlugin,
  elementSymbol,
  EventSpec,
  Data,
  Value,
} from './mockDriver';

export * from './hyperscript-helpers';
export * from './types';

export function makeDomPlugin(
  container: string | DocumentFragment | Element,
  modules?: Module[]
): [DomDriver, typeof makeDomApi] {
  return [new DomDriver(container, modules), makeDomApi];
}

export function total(value: ScopeValue): Scope {
  return { type: 'total', value };
}
export function sibling(value: ScopeValue): Scope {
  return { type: 'sibling', value };
}
