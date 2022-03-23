import {
  ScopeType,
  ScopeValue,
  Namespace,
  AddEventListenerCommand,
  AddElementsListenerCommand,
} from './types';
import { isInScope } from './helpers';

export class NamespaceTree {
  private tree = new TreeNode(this, []);
  private treenodeMap = new Map<Element, TreeNode>();
  public querySet = new Set<Set<Element>>();

  public setRootElement(node: Element): void {
    this.tree.setRootElement(node);
  }

  public insertNamespaceRoot(node: Element, namespace: Namespace): TreeNode {
    const n = this.tree.traverse(namespace);
    n.setRootElement(node);
    this.treenodeMap.set(node, n);
    return n;
  }

  public removeNamespaceRoot(node: Element): void {
    const treeNode = this.treenodeMap.get(node);
    if (treeNode) {
      this.treenodeMap.delete(node);
      treeNode.removeSelf();
    }
  }

  public insertVirtualListener(cmd: AddEventListenerCommand): void {
    this.tree.insertVirtualListener(cmd);
  }

  public getNamespaceRoot(node: Element): TreeNode {
    let curr = node;
    let result = this.treenodeMap.get(curr);
    while (!result) {
      curr = curr.parentNode as Element;
      result = this.treenodeMap.get(curr);
    }
    return result;
  }
}

export class TreeNode {
  private nodes: Map<ScopeType, Map<ScopeValue, TreeNode>> | undefined;
  private listeners: Map<boolean, Map<string, number>> | undefined;
  private queries: Map<string, [Set<number>, Set<Element>]> | undefined;
  private rootElement: Element | undefined;

  constructor(
    private readonly tree: NamespaceTree,
    public readonly namespace: Namespace,
    public readonly scopeType: ScopeType = 'total',
    public readonly parent?: TreeNode
  ) {}

  public setRootElement(node: Element): void {
    this.rootElement = node;
  }

  public insertElementListener(
    cmd: AddElementsListenerCommand
  ): Set<Element> | undefined {
    if (!this.queries) {
      this.queries = new Map<string, [Set<number>, Set<Element>]>();
    }
    const entry = this.queries.get(cmd.selector);
    if (entry) {
      entry[0].add(cmd.id);
      return entry[1];
    } else {
      const elements = this.getQueryElements(cmd.selector);
      const set = elements ?? new Set();
      this.tree.querySet.add(set);
      this.queries.set(cmd.selector, [new Set([cmd.id]), set]);
      return elements;
    }
  }

  public insertVirtualListener(cmd: AddEventListenerCommand): void {
    const node = this.traverse(cmd.namespace);
    const capture = cmd.options?.capture ?? false;
    if (!node.listeners) {
      node.listeners = new Map<boolean, Map<string, number>>();
    }
    let inner = node.listeners.get(capture);
    if (!inner) {
      inner = new Map<string, number>();
      node.listeners.set(capture, inner);
    }
    inner.set(cmd.selector, cmd.id);
  }

  public getListeners(capture: boolean): Map<string, number> | undefined {
    return this.listeners?.get(capture);
  }

  public removeSelf(): void {
    if (this.parent) {
      const value = this.namespace[this.namespace.length - 1].value;
      this.parent.nodes?.get(this.scopeType)!.delete(value);
      const values = this.queries?.values();
      if (values) {
        for (const v of values) {
          this.tree.querySet.delete(v[1]);
        }
      }
    }
  }

  public traverse(namespace: Namespace): TreeNode {
    const go = (idx: number, tree: TreeNode): TreeNode => {
      if (idx < namespace.length) {
        const n = namespace[idx];

        if (!tree.nodes) {
          tree.nodes = new Map<ScopeType, Map<ScopeValue, TreeNode>>();
        }
        let outer = tree.nodes.get(n.type);
        if (!outer) {
          outer = new Map<ScopeValue, TreeNode>();
          tree.nodes.set(n.type, outer);
        }

        let inner = outer.get(n.value);
        if (!inner) {
          inner = new TreeNode(
            this.tree,
            this.namespace.concat(n),
            n.type,
            tree
          );
          outer.set(n.value, inner);
        }
        return go(idx + 1, inner);
      } else {
        return tree;
      }
    };
    return go(0, this);
  }

  private getQueryElements(selector: string): Set<Element> | undefined {
    if (!this.rootElement) {
      return;
    }
    const allElements = this.rootElement.querySelectorAll(selector);
    let inScope = undefined;
    for (const element of allElements) {
      const namespace = this.tree.getNamespaceRoot(element).namespace;
      if (isInScope(namespace, this.namespace)) {
        if (!inScope) {
          inScope = new Set<Element>();
        }
        inScope.add(element);
      }
    }
  }
}
