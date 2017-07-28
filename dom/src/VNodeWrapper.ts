import {VNode, vnode as vnodeFn} from 'snabbdom/vnode';
import {h} from 'snabbdom/h';
import {classNameFromVNode} from 'snabbdom-selector/lib/commonjs/classNameFromVNode';
import {selectorParser} from 'snabbdom-selector/lib/commonjs/selectorParser';
import {isDocFrag} from './utils';

export class VNodeWrapper {
  constructor(public rootElement: Element | DocumentFragment) {}

  public call(vnode: VNode | null): VNode {
    if (isDocFrag(this.rootElement)) {
      return this.wrapDocFrag(vnode === null ? [] : [vnode]);
    }
    if (vnode === null) {
      return this.wrap([]);
    }
    const {tagName: selTagName, id: selId} = selectorParser(vnode);
    const vNodeClassName = classNameFromVNode(vnode);
    const vNodeData = vnode.data || {};
    const vNodeDataProps = vNodeData.props || {};
    const {id: vNodeId = selId} = vNodeDataProps;

    const isVNodeAndRootElementIdentical =
      typeof vNodeId === 'string' &&
      vNodeId.toUpperCase() === this.rootElement.id.toUpperCase() &&
      selTagName.toUpperCase() === this.rootElement.tagName.toUpperCase() &&
      vNodeClassName.toUpperCase() === this.rootElement.className.toUpperCase();

    if (isVNodeAndRootElementIdentical) {
      return vnode;
    }

    return this.wrap([vnode]);
  }

  private wrapDocFrag(children: Array<VNode>) {
    return vnodeFn('', {}, children, undefined, this.rootElement as any);
  }

  private wrap(children: Array<VNode>) {
    const {tagName, id, className} = this.rootElement as Element;
    const selId = id ? `#${id}` : '';
    const selClass = className ? `.${className.split(` `).join(`.`)}` : '';
    return h(`${tagName.toLowerCase()}${selId}${selClass}`, {}, children);
  }
}
