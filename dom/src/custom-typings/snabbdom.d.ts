declare module 'snabbdom' {
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
}

declare module 'snabbdom/vnode' {
  import {VNode} from 'snabbdom';
  function vnode(sel?: any, data?: any, children?: any, text?: any, elm?: any): VNode;
  export = vnode;
}

declare module 'snabbdom/is' {
  export function array(x: any): boolean;
  export function primitive(x: any): boolean;
}

declare module 'snabbdom/thunk' {
  import {VNode} from 'snabbdom';
  function thunk(name: string, fn: Function): VNode;
  export = thunk;
}

declare module 'snabbdom/modules/class' {
  let ClassModule: Object;
  export = ClassModule;
}
declare module 'snabbdom/modules/props' {
  let PropsModule: Object;
  export = PropsModule;
}
declare module 'snabbdom/modules/attributes' {
  let AttrsModule: Object;
  export = AttrsModule;
}
declare module 'snabbdom/modules/eventlisteners' {
  let EventsModule: Object;
  export = EventsModule;
}
declare module 'snabbdom/modules/hero' {
  let HeroModule: Object;
  export = HeroModule;
}
declare module 'snabbdom/modules/style' {
  let StyleModule: Object;
  export = StyleModule;
}
