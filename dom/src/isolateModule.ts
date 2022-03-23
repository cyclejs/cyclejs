import { Module } from 'snabbdom';

import { NamespaceTree } from './namespaceTree';

export function makeIsolateModule(componentTree: NamespaceTree): Module {
  return {
    create: (_, vnode) => {
      if (vnode.data?.namespace) {
        vnode.data.treeNode = componentTree.insertNamespaceRoot(
          vnode.elm as Element,
          vnode.data.namespace
        );
      }
    },
    update: (oldVNode, vnode) => {
      if (vnode.data?.namespace) {
        vnode.data.treeNode = oldVNode.data!.treeNode;
      }
    },
    destroy: vnode => {
      if (vnode.data?.namespace) {
        componentTree.removeNamespaceRoot(vnode.elm as Element);
      }
    },
  };
}
