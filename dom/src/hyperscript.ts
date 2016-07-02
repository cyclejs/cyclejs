import {Stream} from 'xstream';
import {VNode} from './interfaces';
import * as is from 'snabbdom/is';
const vnode = require('snabbdom/vnode');

function isGenericStream(x: any): boolean {
  return !Array.isArray(x) && typeof x.map === `function`;
}

function mutateStreamWithNS(vNode: VNode): VNode {
  addNS(vNode.data, vNode.children, vNode.sel);
  return vNode;
}

function addNS(data: Object, children: Array<VNode | string | Stream<VNode>>, selector: string): void {
  (<any> data).ns = `http://www.w3.org/2000/svg`;
  if (selector !== `foreignObject` && typeof children !== `undefined` && is.array(children)) {
    for (let i = 0; i < children.length; ++i) {
      if (isGenericStream(children[i])) {
        children[i] = (<Stream<VNode>> children[i]).map(mutateStreamWithNS);
      } else {
        addNS((<VNode> children[i]).data, (<VNode> children[i]).children, (<VNode> children[i]).sel);
      }
    }
  }
}

export function h(sel: string, b?: any, c?: any): VNode {
  let data = {};
  let children: Array<VNode | string | Stream<VNode>>;
  let text: string;
  let i: number;
  if (arguments.length === 3) {
    data = b;
    if (is.array(c)) {
      children = c;
    } else if (is.primitive(c)) {
      text = c;
    }
  } else if (arguments.length === 2) {
    if (is.array(b)) {
      children = b;
    } else if (is.primitive(b)) {
      text = b;
    } else {
      data = b;
    }
  }
  if (is.array(children)) {
    children = children.filter(x => <boolean>x);
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) {
        children[i] = vnode(undefined, undefined, undefined, children[i]);
      }
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children, sel);
  }
  return vnode(sel, data, children, text, undefined);
};
