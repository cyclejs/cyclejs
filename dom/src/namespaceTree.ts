import {
  ScopeType,
  ScopeValue,
  Namespace,
  AddEventListenerCommand,
  AddElementsListenerCommand,
  RemoveElementsListenerCommand,
} from './types';
import { isInScope } from './helpers';

export class NamespaceTree {
  private tree = new TreeNode(this, []);
  private treenodeMap = new Map<Element, TreeNode>();
  public elementListenerMap = new Map<number, TreeNode>();

  public setRootElement(node: Element): void {
    this.tree.setRootElement(node);
    this.treenodeMap.set(node, this.tree);
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

  public checkQueries(node: Element): Array<[Set<number>, Set<Element>]> {
    return this.getNamespaceRoot(node).checkQueries(node);
  }

  public removeElementFromQueries(node: Element): void {
    this.getNamespaceRoot(node).removeElementFromQueries(node);
  }

  public insertElementListener(
    cmd: AddElementsListenerCommand
  ): Set<Element> | undefined {
    return this.tree.insertElementListener(cmd);
  }

  public removeElementListener(cmd: RemoveElementsListenerCommand): void {
    this.elementListenerMap.get(cmd.id)!.removeElementListener(cmd);
    this.elementListenerMap.delete(cmd.id);
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
    const node = this.traverse(cmd.namespace);
    this.tree.elementListenerMap.set(cmd.id, node);
    if (!node.queries) {
      node.queries = new Map<string, [Set<number>, Set<Element>]>();
    }
    const entry = node.queries.get(cmd.selector);
    if (entry) {
      entry[0].add(cmd.id);
      return entry[1];
    } else {
      const elements = node.getQueryElements(cmd.selector);
      const set = elements ?? new Set();
      const receivers = new Set([cmd.id]);
      node.queries.set(cmd.selector, [receivers, set]);
      return elements;
    }
  }

  public removeElementListener(cmd: RemoveElementsListenerCommand): void {
    if (this.queries) {
      for (const [k, v] of this.queries.entries()) {
        v[0].delete(cmd.id);
        if (v[0].size === 0) {
          this.queries.delete(k);
        }
      }
    }
  }

  public checkQueries(node: Element): Array<[Set<number>, Set<Element>]> {
    let result: Array<[Set<number>, Set<Element>]> = [];

    if (this.queries) {
      for (const q of this.queries.entries()) {
        if (node.matches(q[0])) {
          q[1][1].add(node);
          result.push(q[1]);
        }
      }
    }
    if (this.scopeType === 'sibling' && this.parent) {
      result = this.parent.checkQueries(node).concat(result);
    }
    return result;
  }

  public removeElementFromQueries(node: Element): void {
    if (this.queries) {
      for (const [_, s] of this.queries.values()) {
        s.delete(node);
      }
    }
    if (this.scopeType === 'sibling' && this.parent) {
      this.parent.removeElementFromQueries(node);
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
    }
    if (this.queries) {
      for (const v of this.queries.values()) {
        for (const n of v[0].keys()) {
          this.tree.elementListenerMap.delete(n);
        }
      }
    }
  }

  public traverse(namespace: Namespace, idx: number = 0): TreeNode {
    if (idx < namespace.length) {
      const n = namespace[idx];

      if (!this.nodes) {
        this.nodes = new Map<ScopeType, Map<ScopeValue, TreeNode>>();
      }
      let outer = this.nodes.get(n.type);
      if (!outer) {
        outer = new Map<ScopeValue, TreeNode>();
        this.nodes.set(n.type, outer);
      }

      let inner = outer.get(n.value);
      if (!inner) {
        inner = new TreeNode(this.tree, this.namespace.concat(n), n.type, this);
        outer.set(n.value, inner);
      }
      return inner.traverse(namespace, idx + 1);
    } else {
      return this;
    }
  }

  private getQueryElements(selector: string): Set<Element> | undefined {
    if (!this.rootElement) {
      return;
    }
    let inScope =
      selector === '' || this.rootElement.matches(selector)
        ? new Set([this.rootElement])
        : undefined;

    if (selector !== '') {
      const allElements = this.rootElement.querySelectorAll(selector);
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
    return inScope;
  }
}
