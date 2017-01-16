import {VNode} from 'snabbdom/vnode';
import {SCOPE_PREFIX} from './utils';
import {DOMSource} from './DOMSource';

export function isolateSource<S extends DOMSource>(source: S, scope: string): S {
  return source.select<S>(SCOPE_PREFIX + scope);
}

interface Mappable<T, R> {
  map(mapFn: (x: T) => R): Mappable<R, any>;
}

export function isolateSink(sink: any, scope: string): any {
  return sink.map((vnode: VNode) => {
    if (vnode.data && (vnode.data as any).isolate) {
      const existingScope = (vnode.data as any).isolate.replace(/(cycle|\-)/g, '');
      const _scope = scope.replace(/(cycle|\-)/g, '');

      if (isNaN(parseInt(existingScope))
      || isNaN(parseInt(_scope))
      || existingScope > _scope) {
        return vnode;
      }
    }
    vnode.data = vnode.data || {};
    (vnode.data as any).isolate = scope;
    if (typeof vnode.key === 'undefined') {
      vnode.key = SCOPE_PREFIX + scope;
    }
    return vnode;
  });
}
