import { Module } from 'snabbdom';

import { NamespaceTree } from './namespaceTree';

export function makeIsolateModule(componentTree: NamespaceTree): Module {
  return {
    create: (_, vnode) => {
      if (vnode.data?.namespace) {
        componentTree.insertNamespaceRoot(vnode.elm!, vnode.data.namespace);
      }
    },
    destroy: vnode => {
      if (vnode.data?.namespace) {
      }
    },
  };
}
