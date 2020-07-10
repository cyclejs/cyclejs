import xs, {Stream, InternalListener, OutSender, Operator} from 'xstream';
import {InternalInstances} from './types';

class PickMergeListener<Si, T> implements InternalListener<T>, OutSender<T> {
  public ins: Stream<T>;
  public out: Stream<T>;
  public p: PickMerge<Si, T>;

  constructor(out: Stream<T>, p: PickMerge<Si, T>, ins: Stream<T>) {
    this.ins = ins;
    this.out = out;
    this.p = p;
  }

  public _n(t: T): void {
    const p = this.p,
      out = this.out;
    if (out === null) {
      return;
    }
    out._n(t);
  }

  public _e(err: any): void {
    const out = this.out;
    if (out === null) {
      return;
    }
    out._e(err);
  }

  public _c(): void {}
}

class PickMerge<Si, T> implements Operator<InternalInstances<Si>, T> {
  public type = 'pickMerge';
  public ins: Stream<InternalInstances<Si>>;
  public out: Stream<T>;
  public sel: string;
  public ils: Map<string, PickMergeListener<Si, T>>;
  public inst: InternalInstances<Si>;

  constructor(sel: string, ins: Stream<InternalInstances<Si>>) {
    this.ins = ins;
    this.out = null as any;
    this.sel = sel;
    this.ils = new Map();
    this.inst = null as any;
  }

  public _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  public _stop(): void {
    this.ins._remove(this);
    const ils = this.ils;
    ils.forEach((il, key) => {
      il.ins._remove(il);
      il.ins = null as any;
      il.out = null as any;
      ils.delete(key);
    });
    ils.clear();
    this.out = null as any;
    this.ils = new Map();
    this.inst = null as any;
  }

  public _n(inst: InternalInstances<Si>): void {
    this.inst = inst;
    const arrSinks = inst.arr;
    const ils = this.ils;
    const out = this.out;
    const sel = this.sel;
    const n = arrSinks.length;
    // add
    for (let i = 0; i < n; ++i) {
      const sinks = arrSinks[i];
      const key = (sinks._key as any) as string;
      const sink: Stream<any> = xs.fromObservable(sinks[sel] || xs.never());
      if (!ils.has(key)) {
        ils.set(key, new PickMergeListener(out, this, sink));
        sink._add(ils.get(key) as PickMergeListener<Si, T>);
      }
    }
    // remove
    ils.forEach((il, key) => {
      if (!inst.dict.has(key) || !inst.dict.get(key)) {
        il.ins._remove(il);
        il.ins = null as any;
        il.out = null as any;
        ils.delete(key);
      }
    });
  }

  public _e(err: any) {
    const u = this.out;
    if (u === null) {
      return;
    }
    u._e(err);
  }

  public _c() {
    const u = this.out;
    if (u === null) {
      return;
    }
    u._c();
  }
}

export function pickMerge(selector: string) {
  return function pickMergeOperator(
    inst$: Stream<InternalInstances<any>>
  ): Stream<any> {
    return new Stream(new PickMerge(selector, inst$));
  };
}
