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
  return <Mappable<VNode, VNode>>sink.map((vTree: VNode) => {
    if (vTree.data.isolate) {
      const existingScope =
        parseInt(vTree.data.isolate.split(SCOPE_PREFIX + 'cycle')[1]);

      const _scope = parseInt(scope.split('cycle')[1]);

      if (isNaN(existingScope) || isNaN(_scope) || existingScope > _scope) {
        return vTree;
      }
    }
    vTree.data.isolate = SCOPE_PREFIX + scope;
    if (typeof vTree.key === 'undefined') {
      vTree.key = SCOPE_PREFIX + scope;
    }
    return vTree;
  });
}
