import {VNode} from 'snabbdom';
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
    vTree.data.isolate = SCOPE_PREFIX + scope;
    return vTree;
  });
}
