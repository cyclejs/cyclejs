import {VNode} from 'snabbdom/vnode';
import {SCOPE_PREFIX} from './utils';
import {DOMSource} from './DOMSource';

export function isolateSource<S extends DOMSource>(source: S, scope: string): S {
  return source.select<S>(SCOPE_PREFIX + scope);
}

export interface Mappable<T> {
  map<R>(mapFn: (x: T) => R): Mappable<R>;
}

export function isolateSink(sink: Mappable<VNode>, fullScope: string): Mappable<VNode> {
  return sink.map((vnode: VNode) => {
    // Ignore if already had up-to-date full scope in vnode.data.isolate
    if (vnode.data && (vnode.data as any).isolate) {
      const isolateData = (vnode.data as any).isolate as string;
      const prevFullScopeNum = isolateData.replace(/(cycle|\-)/g, '');
      const fullScopeNum = fullScope.replace(/(cycle|\-)/g, '');

      if (isNaN(parseInt(prevFullScopeNum))
      || isNaN(parseInt(fullScopeNum))
      || prevFullScopeNum > fullScopeNum) { // > is lexicographic string comparison
        return vnode;
      }
    }

    // Insert up-to-date full scope in vnode.data.isolate, and also a key if needed
    vnode.data = vnode.data || {};
    (vnode.data as any).isolate = fullScope;
    if (typeof vnode.key === 'undefined') {
      vnode.key = SCOPE_PREFIX + fullScope;
    }
    return vnode;
  });
}
