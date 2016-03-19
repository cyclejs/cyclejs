import {Observable} from 'rx';
import {VNode} from 'snabbdom';

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

export function transposeVTree(vnode: any) {
  if (!vnode) {
    return null;
  } else if (vnode && typeof vnode.data === `object` && vnode.data.static) {
    return Observable.of(vnode);
  } else if (typeof vnode.subscribe === `function`) {
    return vnode.flatMapLatest(transposeVTree);
  } else if (typeof vnode === `object`) {
    if (!vnode.children || vnode.children.length === 0) {
      return Observable.of(vnode);
    }

    const vnodeChildren = vnode.children
      .map(transposeVTree)
      .filter((x: any) => x !== null);

    return vnodeChildren.length === 0 ?
      Observable.of(createVTree(vnode, vnodeChildren)) :
      Observable.combineLatest(vnodeChildren,
        (...children) => createVTree(vnode, children)
      );
  } else {
    throw new Error(`Unhandled vTree Value`);
  }
}
