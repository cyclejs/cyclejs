declare module 'snabbdom-to-html' {
  import {VNode} from 'snabbdom';
  function toHTML(vNode: VNode): string;
  export = toHTML;
}
