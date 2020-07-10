import {VNode, VNodeData} from 'snabbdom/vnode';
import {h} from 'snabbdom/h';

export interface ThunkData extends VNodeData {
  fn(): VNode;
  args: Array<any>;
}

export interface Thunk extends VNode {
  data: ThunkData;
}

function copyToThunk(vnode: VNode, thunkVNode: Thunk): void {
  thunkVNode.elm = vnode.elm;
  (vnode.data as ThunkData).fn = thunkVNode.data.fn;
  (vnode.data as ThunkData).args = thunkVNode.data.args;
  (vnode.data as ThunkData).isolate = thunkVNode.data.isolate;
  thunkVNode.data = vnode.data as ThunkData;
  thunkVNode.children = vnode.children;
  thunkVNode.text = vnode.text;
  thunkVNode.elm = vnode.elm;
}

function init(thunkVNode: Thunk): void {
  const cur = thunkVNode.data as VNodeData;
  const vnode = (cur.fn as any).apply(undefined, cur.args);
  copyToThunk(vnode, thunkVNode);
}

function prepatch(oldVnode: Thunk, thunkVNode: Thunk): void {
  const old = oldVnode.data as VNodeData,
    cur = thunkVNode.data as VNodeData;
  let i: number;
  const oldArgs = old.args,
    args = cur.args;
  if (old.fn !== cur.fn || (oldArgs as any).length !== (args as any).length) {
    copyToThunk((cur.fn as any).apply(undefined, args), thunkVNode);
  }
  for (i = 0; i < (args as any).length; ++i) {
    if ((oldArgs as any)[i] !== (args as any)[i]) {
      copyToThunk((cur.fn as any).apply(undefined, args), thunkVNode);
      return;
    }
  }
  copyToThunk(oldVnode, thunkVNode);
}

export function thunk(sel: string, fn: Function, args: Array<any>): Thunk;
export function thunk(
  sel: string,
  key: any,
  fn: Function,
  args: Array<any>
): Thunk;
export function thunk(sel: string, key?: any, fn?: any, args?: any): VNode {
  if (args === undefined) {
    args = fn;
    fn = key;
    key = undefined;
  }
  return h(sel, {
    key: key,
    hook: {init: init, prepatch: prepatch},
    fn: fn,
    args: args,
  } as VNodeData);
}

export default thunk;
