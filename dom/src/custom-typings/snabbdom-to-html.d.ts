declare module 'snabbdom-to-html' {
  import {VNode} from 'snabbdom';
  export default function toHTML(vNode: VNode): string;
}
