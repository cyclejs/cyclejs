export interface VNode {
  sel?: string;
  data?: any;
  children?: Array<VNode | string>;
  text?: string;
  key?: any;
  elm?: Element;
}

export interface PatchFunction {
  (oldVNode: VNode, vnode: VNode): VNode;
}

export function init(modules: Object, api?: Object): PatchFunction;
