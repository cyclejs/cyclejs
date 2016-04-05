import {VNode} from 'snabbdom';
import {SCOPE_PREFIX} from './utils';
import {DOMSource} from './DOMSource';

export function isolateSource(source: DOMSource, scope: string): DOMSource {
  return source.select(`.${SCOPE_PREFIX}${scope}`);
}

interface Mappable<T, R> {
  map(mapFn: (x: T) => R): Mappable<R, any>;
}

export function isolateSink(sink: any, scope: string): any {
  return <Mappable<VNode, VNode>>sink.map((vTree: VNode) => {
    if (vTree.sel.indexOf(`${SCOPE_PREFIX}${scope}`) === -1) {
      if (vTree.data && vTree.data.ns) { // svg elements
        const attrs = vTree.data.attrs || {};
        attrs.class = `${attrs.class || ''} ${SCOPE_PREFIX}${scope}`;
        vTree.data.attrs = attrs;
      } else {
        vTree.sel = `${vTree.sel}.${SCOPE_PREFIX}${scope}`;
      }
    }
    return vTree;
  });
}
