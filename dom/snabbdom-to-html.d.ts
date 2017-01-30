declare module 'snabbdom-to-html' {
  import {VNode} from 'snabbdom/vnode';
  function toHTML(vNode: VNode): string;
  export = toHTML;
}
