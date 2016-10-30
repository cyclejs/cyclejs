import {VNode} from './interfaces';
import {SCOPE_PREFIX} from './utils';
import {DOMSource} from './DOMSource';

export function isolateSource(source: DOMSource, scope: string): DOMSource {
  return source.select(SCOPE_PREFIX + scope);
}

interface Mappable<T, R> {
  map(mapFn: (x: T) => R): Mappable<R, any>;
}

export function isolateSink(sink: any, scope: string): any {
  return sink.map((vTree: VNode) => {
    if (vTree.data && vTree.data.isolate) {
      const existingScope = vTree.data.isolate.replace(/(cycle|\-)/g, '');
      const _scope = scope.replace(/(cycle|\-)/g, '');

      if (isNaN(parseInt(existingScope))
      || isNaN(parseInt(_scope))
      || existingScope > _scope) {
        return vTree;
      }
    }
    vTree.data = vTree.data || {};
    vTree.data.isolate = scope;
    if (typeof vTree.key === 'undefined') {
      vTree.key = SCOPE_PREFIX + scope;
    }
    return vTree;
  });
}
