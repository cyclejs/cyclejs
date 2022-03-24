import { Module } from 'snabbdom';

import { NamespaceTree } from './namespaceTree';

export function makeIsolateModule(
  componentTree: NamespaceTree,
  notify: (s: Set<number>, element: Element) => void
): Module {
  const newElements = new Set<Element>();
  return {
    create: (_, vnode) => {
      if (vnode.data?.namespace) {
        vnode.data.treeNode = componentTree.insertNamespaceRoot(
          vnode.elm as Element,
          vnode.data.namespace
        );
      }

      // This indirection is needed because vnode.elm is not inserted into the DOM yet
      newElements.add(vnode.elm as Element);
    },
    post: () => {
      for (const e of newElements.keys()) {
        const receivers = componentTree.checkQueries(e);
        if (receivers) {
          notify(receivers, e);
        }
      }
      newElements.clear();
    },
    update: (oldVNode, vnode) => {
      if (vnode.data?.namespace) {
        vnode.data.treeNode = oldVNode.data!.treeNode;
      }
      const receivers = componentTree.queryMap.get(vnode.elm as Element);
      if (receivers && !deepEqual(oldVNode.data, vnode.data)) {
        notify(receivers, vnode.elm as Element);
      }
    },
    destroy: vnode => {
      if (vnode.data?.namespace) {
        componentTree.removeNamespaceRoot(vnode.elm as Element);
      }
      componentTree.removeElementFromQueries(vnode.elm as Element);
    },
  };
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    let length;
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) {
        return false;
      }
      for (let i = length; i-- !== 0; ) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }

    const keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) {
      return false;
    }

    for (let i = length; i-- !== 0; ) {
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
        return false;
      }
    }

    for (let i = length; i-- !== 0; ) {
      const key = keys[i];
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
}
