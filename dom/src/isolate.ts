import {Observable} from 'rx';
import {SCOPE_PREFIX} from './utils';
import {DOMSource} from './DOMSource';

export function isolateSource(source: DOMSource, scope: string): DOMSource {
  return source.select(`.${SCOPE_PREFIX}${scope}`);
}

export function isolateSink(sink: Observable<any>, scope: string): Observable<any> {
  return sink.map(vTree => {
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
