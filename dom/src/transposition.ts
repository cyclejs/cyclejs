import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import xs, {Stream} from 'xstream';
import {VNode} from './interfaces';

function createVTree(vnode: VNode, children: Array<any>): any {
  return {
    sel: vnode.sel,
    data: vnode.data,
    text: vnode.text,
    elm: vnode.elm,
    key: vnode.key,
    children,
  };
}

export function makeTransposeVNode(runStreamAdapter: StreamAdapter): (vnode: any) => Stream<VNode> {
  return function transposeVNode(vnode: any): any {
    if (!vnode) {
      return null;
    } else if (vnode && typeof vnode.data === `object` && vnode.data.static) {
      return xs.of(vnode);
    } else if (runStreamAdapter.isValidStream(vnode)) {
      const xsStream: Stream<any> = XStreamAdapter.adapt(vnode, runStreamAdapter.streamSubscribe);
      return <any> xsStream.map(transposeVNode).flatten();
    } else if (typeof vnode === `object`) {
      if (!vnode.children || vnode.children.length === 0) {
        return xs.of(vnode);
      }

      const vnodeChildren = vnode.children
        .map(transposeVNode)
        .filter((x: any) => x !== null);

      return vnodeChildren.length === 0 ?
        xs.of(createVTree(vnode, vnodeChildren)) :
        xs.combine(
          (...children) => createVTree(vnode, children),
          ...vnodeChildren
        );
    } else {
      throw new Error(`Unhandled vTree Value`);
    }
  };
}
