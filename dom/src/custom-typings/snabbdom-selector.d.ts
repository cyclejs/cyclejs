declare module 'snabbdom-selector/lib/classNameFromVNode' {
  import {VNode} from 'snabbdom';
  export default function classNameFromVNode(vNode: VNode): string;
}

declare module 'snabbdom-selector/lib/selectorParser' {
  export interface ParsedSelector {
    tagName: string;
    id: string;
    className: string;
  }
  export default function selectorParser(selector: string): ParsedSelector;
}
