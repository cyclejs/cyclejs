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
  public queryMap = new Map<Element, Set<number>>();
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

  public checkQueries(node: Element): Set<number> | undefined {
    return this.getNamespaceRoot(node).checkQueries(node);
  }

  public removeElementFromQueries(node: Element): void {
    if (this.queryMap.delete(node)) {
      this.getNamespaceRoot(node).removeElementFromQueries(node);
    }
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
      for (const e of entry[1].keys()) {
        let receivers = this.tree.queryMap.get(e)!;
        receivers.add(cmd.id);
        this.tree.queryMap.set(e, receivers);
      }
      return entry[1];
    } else {
      const elements = node.getQueryElements(cmd.selector);
      const set = elements ?? new Set();
      const receivers = new Set([cmd.id]);
      for (const e of set.keys()) {
        this.tree.queryMap.set(e, receivers);
      }
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
        for (const e of v[1]) {
          const r = this.tree.queryMap.get(e);
          if (r) {
            r.delete(cmd.id);
          }
        }
      }
    }
  }

  public checkQueries(
    node: Element,
    newResult = false
  ): Set<number> | undefined {
    let result = undefined;

    if (this.queries) {
      for (const q of this.queries.entries()) {
        if (node.matches(q[0])) {
          q[1][1].add(node);
          if (!result) {
            result = q[1][0];
            continue;
          }

          if (!newResult) {
            result = new Set(result);
            newResult = true;
          }
          for (const n of q[1][0].keys()) {
            result.add(n);
          }
        }
      }
    }
    if (this.scopeType === 'sibling' && this.parent) {
      const r = this.parent.checkQueries(node, newResult);
      if (r) {
        if (!result) {
          result = r;
        } else {
          if (!newResult) {
            result = new Set(result);
            newResult = true;
          }
          for (const n of r.keys()) {
            result.add(n);
          }
        }
      }
    }
    if (result) {
      this.tree.queryMap.set(node, result);
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
    const allElements = this.rootElement.querySelectorAll(selector);
    let inScope = this.rootElement.matches(selector)
      ? new Set([this.rootElement])
      : undefined;
    for (const element of allElements) {
      const namespace = this.tree.getNamespaceRoot(element).namespace;
      if (isInScope(namespace, this.namespace)) {
        if (!inScope) {
          inScope = new Set<Element>();
        }
        inScope.add(element);
      }
    }
    return inScope;
  }
}
