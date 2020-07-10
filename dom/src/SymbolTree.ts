type Node<Payload> = [Payload | undefined, InternalTree<Payload>];

interface InternalTree<Payload> {
  [name: string]: Node<Payload>;
}

export default class SymbolTree<Payload, T> {
  private tree: Node<Payload> = [undefined, {}];

  constructor(private mapper: (t: T) => string) {}

  public set(path: Array<T>, element: Payload | undefined, max?: number): void {
    let curr = this.tree;
    const _max = max !== undefined ? max : path.length;
    for (let i = 0; i < _max; i++) {
      const n = this.mapper(path[i]);
      let child: Node<Payload> = curr[1][n];
      if (!child) {
        child = [undefined, {}];
        curr[1][n] = child;
      }
      curr = child;
    }
    curr[0] = element;
  }

  public getDefault(
    path: Array<T>,
    mkDefaultElement: () => Payload,
    max?: number
  ): Payload {
    return this.get(path, mkDefaultElement, max) as Payload;
  }

  /**
   * Returns the payload of the path
   * If a default element creator is given, it will insert it at the path
   */
  public get(
    path: Array<T>,
    mkDefaultElement?: () => Payload,
    max?: number
  ): Payload | undefined {
    let curr = this.tree;
    const _max = max !== undefined ? max : path.length;
    for (let i = 0; i < _max; i++) {
      const n = this.mapper(path[i]);
      let child: Node<Payload> = curr[1][n];
      if (!child) {
        if (mkDefaultElement) {
          child = [undefined, {}];
          curr[1][n] = child;
        } else {
          return undefined;
        }
      }
      curr = child;
    }
    if (mkDefaultElement && !curr[0]) {
      curr[0] = mkDefaultElement();
    }
    return curr[0];
  }

  public delete(path: Array<T>): void {
    let curr = this.tree;
    for (let i = 0; i < path.length - 1; i++) {
      const child = curr[1][this.mapper(path[i])];
      if (!child) {
        return;
      }
      curr = child;
    }
    delete curr[1][this.mapper(path[path.length - 1])];
  }
}
