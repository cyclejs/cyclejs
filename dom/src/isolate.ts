import {Stream} from 'xstream';
import {VNode, vnode} from 'snabbdom/vnode';
import {SCOPE_PREFIX, isClassOrId} from './utils';
import {DOMSource} from './DOMSource';

function totalIsolateSource<S extends DOMSource>(source: S, scope: string): S {
  return source.select<S>(SCOPE_PREFIX + scope);
}

function siblingIsolateSource<S extends DOMSource>(
  source: S,
  scope: string,
): S {
  return source.select<S>(scope);
}

export function isolateSource<S extends DOMSource>(
  source: S,
  scope: string,
): S {
  if (scope === ':root') {
    return source;
  } else if (isClassOrId(scope)) {
    return siblingIsolateSource(source, scope);
  } else {
    return totalIsolateSource(source, scope);
  }
}

export function siblingIsolateSink(
  sink: Stream<VNode | null | undefined>,
  scope: string,
): Stream<VNode | null | undefined> {
  return sink.map(
    node =>
      node
        ? vnode(
            node.sel + scope,
            node.data,
            node.children,
            node.text,
            node.elm as any,
          )
        : node,
  );
}

export function totalIsolateSink(
  sink: Stream<VNode | null | undefined>,
  fullScope: string,
): Stream<VNode | null | undefined> {
  return sink.map(node => {
    if (!node) {
      return node;
    }
    // Ignore if already had up-to-date full scope in vnode.data.isolate
    if (node.data && (node.data as any).isolate) {
      const isolateData = (node.data as any).isolate as string;
      const prevFullScopeNum = isolateData.replace(/(cycle|\-)/g, '');
      const fullScopeNum = fullScope.replace(/(cycle|\-)/g, '');

      if (
        isNaN(parseInt(prevFullScopeNum)) ||
        isNaN(parseInt(fullScopeNum)) ||
        prevFullScopeNum > fullScopeNum
      ) {
        // > is lexicographic string comparison
        return node;
      }
    }

    // Insert up-to-date full scope in vnode.data.isolate, and also a key if needed
    node.data = node.data || {};
    (node.data as any).isolate = fullScope;
    if (typeof node.key === 'undefined') {
      node.key = SCOPE_PREFIX + fullScope;
    }
    return node;
  });
}
