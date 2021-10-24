import {
  ScopeType,
  ScopeValue,
  Namespace,
  AddEventListenerCommand,
} from './types';

export class NamespaceTree {
  private tree = new TreeNode();
  private map = new Map<Node, TreeNode>();

  public setRootNode(node: Node): void {
    this.tree.rootNode = node;
  }

  public insertNamespaceRoot(node: Node, namespace: Namespace): void {
    const n = this.tree.traverse(namespace);
    n.rootNode = node;
    this.map.set(node, n);
  }

  public insertVirtualListener(cmd: AddEventListenerCommand): void {
    this.tree.insertVirtualListener(cmd);
  }

  public getNamespaceRoot(node: Node): TreeNode {
    let curr = node;
    let result = this.map.get(curr);
    while (!result) {
      curr = curr.parentNode!;
      result = this.map.get(curr);
    }
    return result;
  }
}

export class TreeNode {
  private nodes = new Map<ScopeType, Map<ScopeValue, TreeNode>>();
  private listeners = new Map<boolean, Map<string, number>>();
  public rootNode: Node | undefined;

  constructor(
    public readonly scopeType: ScopeType = 'total',
    public readonly parent?: TreeNode
  ) {}

  public insertVirtualListener(cmd: AddEventListenerCommand): void {
    const node = this.traverse(cmd.namespace);
    const capture = cmd.options?.capture ?? false;
    let inner = node.listeners.get(capture);
    if (!inner) {
      inner = new Map<string, number>();
      node.listeners.set(capture, inner);
    }
    inner.set(cmd.selector, cmd.id);
  }

  public getListeners(capture: boolean): Map<string, number> | undefined {
    return this.listeners.get(capture);
  }

  public traverse(namespace: Namespace): TreeNode {
    const go = (idx: number, tree: TreeNode): TreeNode => {
      if (idx < namespace.length) {
        const n = namespace[idx];

        let outer = tree.nodes.get(n.type);
        if (!outer) {
          outer = new Map<ScopeValue, TreeNode>();
          tree.nodes.set(n.type, outer);
        }

        let inner = outer.get(n.value);
        if (!inner) {
          inner = new TreeNode(n.type, tree);
          outer.set(n.value, inner);
        }
        return go(idx + 1, inner);
      } else {
        return tree;
      }
    };
    return go(0, this);
  }
}
