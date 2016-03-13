import {Observable} from 'rx';
import {VNode} from 'snabbdom';
import * as is from 'snabbdom/is';
const vnode = require('snabbdom/vnode');

function isObservable(x: any): boolean {
  return typeof x.subscribe === `function`;
}

function addNSToObservable(vNode: VNode): void {
  addNS(vNode.data, vNode.children);
}

function addNS(data: Object, children: Array<VNode | string | Observable<VNode>>): void {
  (<any> data).ns = `http://www.w3.org/2000/svg`;
  if (typeof children !== `undefined` && is.array(children)) {
    for (let i = 0; i < children.length; ++i) {
      if (isObservable(children[i])) {
        children[i] = (<Observable<VNode>> children[i]).do(addNSToObservable);
      } else {
        addNS((<VNode> children[i]).data, (<VNode> children[i]).children);
      }
    }
  }
}

function h(sel: string, b?: any, c?: any) {
  let data = {};
  let children: Array<VNode | string | Observable<VNode>>;
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
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) {
        children[i] = vnode(undefined, undefined, undefined, children[i]);
      }
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children);
  }
  return vnode(sel, data, children, text, undefined);
};

export default h;
