import {VNode} from 'snabbdom/vnode';
import {h} from './hyperscript';
import {classNameFromVNode} from 'snabbdom-selector/lib/commonjs/classNameFromVNode';
import {selectorParser} from 'snabbdom-selector/lib/commonjs/selectorParser';

export class VNodeWrapper {
  constructor(public rootElement: Element) {
  }

  public call(vnode: VNode | null): VNode {
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

  private wrap(children: Array<VNode>) {
    const {tagName, id, className} = this.rootElement;
    const selId = id ? `#${id}` : '';
    const selClass = className ?
      `.${className.split(` `).join(`.`)}` : '';
    return h(`${tagName.toLowerCase()}${selId}${selClass}`, {}, children);
  }
}
