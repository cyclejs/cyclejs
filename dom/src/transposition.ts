import {StreamAdapter} from '@cycle/base';
import xsSA from '@cycle/xstream-adapter';
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

export function makeTransposeVNode(runStreamAdapter: StreamAdapter) {
  function internalTransposeVNode(vnode: VNode): Stream<VNode> | null {
    if (!vnode) {
      return null;
    } else if (vnode && vnode.data && vnode.data.static) {
      return xs.of(vnode);
    } else if (runStreamAdapter.isValidStream(vnode)) {
      const xsStream: Stream<VNode> = xsSA.adapt(vnode, runStreamAdapter.streamSubscribe);
      return xsStream.map(internalTransposeVNode).flatten();
    } else if (typeof vnode === `object`) {
      if (!vnode.children || vnode.children.length === 0) {
        return xs.of(vnode);
      }

      const vnodeChildren = vnode.children
        .map(internalTransposeVNode)
        .filter(x => x !== null) as Array<Stream<VNode>>;

      if (vnodeChildren.length === 0) {
        return xs.of(createVTree(vnode, []));
      } else {
        return xs.combine(...vnodeChildren)
          .map(children => createVTree(vnode, children.slice()));
      }
    } else {
      throw new Error(`Unhandled vTree Value`);
    }
  };

  return function transposeVNode(vnode: VNode): Stream<VNode> {
    return internalTransposeVNode(vnode) as Stream<VNode>;
  };
}
