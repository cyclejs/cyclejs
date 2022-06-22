import {
  ScopeType,
  ScopeValue,
  Namespace,
  AddEventListenerCommand,
  AddElementsListenerCommand,
  RemoveElementsListenerCommand,
} from './types';
import { isInScope } from './helpers';
import { ID } from '@cycle/run';

export class NamespaceTree {
  private tree = new TreeNode(this, []);
  private treenodeMap = new Map<Element, TreeNode>();
  public elementListenerMap = new Map<ID, TreeNode>();
  public noopIds = new Set<ID>();

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

  public checkQueries(node: Element): Array<[Set<ID>, Set<Element>]> {
    return this.getNamespaceRoot(node).checkQueries(node);
  }

  public removeElementFromQueries(
    node: Element
  ): Array<[Set<ID>, Set<Element>]> {
    return this.getNamespaceRoot(node).removeElementFromQueries(node);
  }

  public insertElementListener(
    cmd: AddElementsListenerCommand
  ): [Set<ID>, Set<Element>] | undefined {
    if (cmd.selector === 'document') {
      this.noopIds.add(cmd.id);
      return [new Set([cmd.id]), new Set([document]) as any];
    }
    if (cmd.selector === 'body') {
      this.noopIds.add(cmd.id);
      return [new Set([cmd.id]), new Set([document.body]) as any];
    }
    return this.tree.insertElementListener(cmd);
  }

  public removeElementListener(cmd: RemoveElementsListenerCommand): void {
    if (!this.noopIds.delete(cmd.id)) {
      this.elementListenerMap.get(cmd.id)!.removeElementListener(cmd);
      this.elementListenerMap.delete(cmd.id);
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
  private listeners: Map<boolean, Map<string, ID>> | undefined;
  private queries: Map<string, [Set<ID>, Set<Element>]> | undefined;
  public rootElement: Element | undefined;

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
  ): [Set<ID>, Set<Element>] | undefined {
    const node = this.traverse(cmd.namespace);
    this.tree.elementListenerMap.set(cmd.id, node);
    if (!node.queries) {
      node.queries = new Map<string, [Set<ID>, Set<Element>]>();
    }
    const entry = node.queries.get(cmd.selector);
    if (entry) {
      entry[0].add(cmd.id);
      return entry[1].size > 0 ? entry : undefined;
    } else {
      const elements = node.getQueryElements(cmd.selector);
      const query = [new Set([cmd.id]), elements ?? new Set()] as [
        Set<ID>,
        Set<Element>
      ];
      node.queries.set(cmd.selector, query);
      return elements ? query : undefined;
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

  public checkQueries(node: Element): Array<[Set<ID>, Set<Element>]> {
    let result: Array<[Set<ID>, Set<Element>]> = [];

    if (this.queries) {
      for (const q of this.queries.entries()) {
        if (
          (q[0] === '' && this.rootElement === node) ||
          (q[0] !== '' && node.matches(q[0]))
        ) {
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

  public removeElementFromQueries(
    node: Element
  ): Array<[Set<ID>, Set<Element>]> {
    let result: Array<[Set<ID>, Set<Element>]> = [];

    if (this.queries) {
      for (const entry of this.queries.values()) {
        if (entry[1].delete(node)) {
          result.push(entry);
        }
      }
    }
    if (this.scopeType === 'sibling' && this.parent) {
      result = this.parent.removeElementFromQueries(node).concat(result);
    }
    return result;
  }

  public insertVirtualListener(cmd: AddEventListenerCommand): void {
    const node = this.traverse(cmd.namespace);
    const capture = cmd.options?.capture ?? false;
    if (!node.listeners) {
      node.listeners = new Map<boolean, Map<string, ID>>();
    }
    let inner = node.listeners.get(capture);
    if (!inner) {
      inner = new Map<string, ID>();
      node.listeners.set(capture, inner);
    }
    inner.set(cmd.selector, cmd.id);
  }

  public getListeners(capture: boolean): Map<string, ID> | undefined {
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
