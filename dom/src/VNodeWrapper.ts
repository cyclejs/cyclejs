import {h, VNode, vnode as vnodeFn} from 'snabbdom';
import {classNameFromVNode, selectorParser} from 'snabbdom-selector';
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
    const {tagName: selTagName, id: selId = ''} = selectorParser(vnode);
    const vNodeClassName = classNameFromVNode(vnode);
    const vNodeData = vnode.data || {};
    const vNodeDataProps = vNodeData.props || {};
    const {id: vNodeId = selId} = vNodeDataProps;

    const isVNodeAndRootElementIdentical =
      typeof vNodeId === 'string' &&
      vNodeId.toUpperCase() === this.rootElement.id.toUpperCase() &&
      selTagName.toUpperCase() === this.rootElement.tagName.toUpperCase() &&
      vNodeClassName.toUpperCase() ===
        this.rootElement.className.toUpperCase() &&
      !this.isRootInDocumentFragment();

    if (isVNodeAndRootElementIdentical) {
      return this.addRootScope(vnode);
    }

    return this.wrap([vnode]);
  }

  private isRootInDocumentFragment(): boolean {
    const parent = this.rootElement.parentNode;
    return parent !== null && isDocFrag(parent as DocumentFragment);
  }

  private wrapDocFrag(children: Array<VNode>) {
    return vnodeFn('', {isolate: []}, children, undefined, this
      .rootElement as any);
  }

  private wrap(children: Array<VNode>) {
    const {tagName, id, className} = this.rootElement as Element;
    const selId = id ? `#${id}` : '';
    const selClass = className ? `.${className.split(` `).join(`.`)}` : '';
    const vnode = h(
      `${tagName.toLowerCase()}${selId}${selClass}`,
      {},
      children
    );
    return this.addRootScope(vnode);
  }

  private addRootScope(vnode: VNode): VNode {
    vnode.data = vnode.data || {};
    vnode.data.isolate = vnode.data.isolate || [];
    return vnode;
  }
}
