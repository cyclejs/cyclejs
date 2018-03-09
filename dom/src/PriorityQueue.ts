export default class PriorityQueue<T> {
  private arr: Array<T> = [];
  private prios: Array<number> = [];

  public add(t: T, prio: number): void {
    for (let i = 0; i < this.arr.length; i++) {
      if (this.prios[i] < prio) {
        this.arr.splice(i, 0, t);
        this.prios.splice(i, 0, prio);
        return;
      }
    }
    this.arr.push(t);
    this.prios.push(prio);
  }

  public forEach(f: (t: T, i: number, arr: Array<T>) => void): void {
    for (let i = 0; i < this.arr.length; i++) {
      f(this.arr[i], i, this.arr);
    }
  }

  public delete(t: T): void {
    for (let i = 0; i < this.arr.length; i++) {
      if (this.arr[i] === t) {
        this.arr.splice(i, 1);
        this.prios.splice(i, 1);
        return;
      }
    }
  }
}
