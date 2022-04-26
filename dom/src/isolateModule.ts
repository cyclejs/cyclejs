import { ID } from '@cycle/run';
import { Module } from 'snabbdom';

import { NamespaceTree } from './namespaceTree';
import { AddElementsListenerCommand } from './types';

export function makeIsolateModule(
  componentTree: NamespaceTree,
  notify: (s: Set<ID>, elements: Element[]) => void
): Module & {
  insertElementListener: (cmd: AddElementsListenerCommand) => void;
} {
  const newElements = new Set<Element>();
  const notifications = new Map<Set<ID>, Set<Element>>();
  const newListenerNotifications = new Map<[Set<ID>, Set<Element>], ID>();
  const set = new Set<ID>();
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
        for (const [k, v] of receivers) {
          if (v.size > 0) {
            notifications.set(k, v);
          }
        }
      }
      newElements.clear();

      for (const [k, v] of newListenerNotifications.entries()) {
        if (!notifications.has(k[0])) {
          set.add(v);
          notify(set, [...k[1]]);
          set.clear();
        }
      }
      newListenerNotifications.clear();
      for (const [k, v] of notifications.entries()) {
        notify(k, [...v]);
      }
      notifications.clear();
    },

    update: (oldVNode, vnode) => {
      if (vnode.data?.namespace) {
        vnode.data.treeNode = oldVNode.data!.treeNode;
      }
      if (!deepEqual(oldVNode.data, vnode.data)) {
        const receivers = componentTree.checkQueries(vnode.elm as Element);
        for (const [k, v] of receivers) {
          if (v.size > 0) {
            notifications.set(k, v);
          }
        }
      }
    },

    destroy: vnode => {
      if (vnode.data?.namespace) {
        componentTree.removeNamespaceRoot(vnode.elm as Element);
      }
      const receivers = componentTree.removeElementFromQueries(
        vnode.elm as Element
      );
      for (const [k, v] of receivers) {
        notifications.set(k, v);
      }
    },

    insertElementListener(cmd: AddElementsListenerCommand) {
      const elems = componentTree.insertElementListener(cmd);
      if (elems) {
        newListenerNotifications.set(elems, cmd.id);
      }
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
