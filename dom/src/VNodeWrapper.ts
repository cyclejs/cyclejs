import {h} from './hyperscript';
import classNameFromVNode from 'snabbdom-selector/lib/classNameFromVNode';
import selectorParser from 'snabbdom-selector/lib/selectorParser';

export class VNodeWrapper {
  constructor(public rootElement: Element) {
  }

  call(vnode: any): any {
    const {tagName: selectorTagName, id: selectorId} = selectorParser(vnode.sel);
    const vNodeClassName = classNameFromVNode(vnode);
    const vNodeData = vnode.data || {};
    const vNodeDataProps = vNodeData.props || {};
    const {id: vNodeId = selectorId} = vNodeDataProps;

    const isVNodeAndRootElementIdentical =
      vNodeId.toUpperCase() === this.rootElement.id.toUpperCase() &&
      selectorTagName.toUpperCase() === this.rootElement.tagName.toUpperCase() &&
      vNodeClassName.toUpperCase() === this.rootElement.className.toUpperCase();

    if (isVNodeAndRootElementIdentical) {
      return vnode;
    }

    const {tagName, id, className} = this.rootElement;
    const elementId = id ? `#${id}` : ``;
    const elementClassName = className ?
      `.${className.split(` `).join(`.`)}` : ``;
    return h(`${tagName.toLowerCase()}${elementId}${elementClassName}`, {}, [
      vnode
    ]);
  }
}
