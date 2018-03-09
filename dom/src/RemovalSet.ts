export default class RemovalSet<T> {
  private toDelete: Array<T> = [];
  private toDeleteSize = 0;
  private _set = new Set<T>();

  public add(t: T): void {
    this._set.add(t);
  }

  public forEach(f: (t: T) => void) {
    this._set.forEach(f);
    this.flush();
  }

  public delete(t: T): void {
    if (this.toDelete.length === this.toDeleteSize) {
      this.toDelete.push(t);
    } else {
      this.toDelete[this.toDeleteSize] = t;
    }
    this.toDeleteSize++;
  }

  public flush(): void {
    for (let i = 0; i < this.toDelete.length; i++) {
      if (i < this.toDeleteSize) {
        this._set.delete(this.toDelete[i]);
      }
      this.toDelete[i] = undefined as any;
    }
    this.toDeleteSize = 0;
  }
}
