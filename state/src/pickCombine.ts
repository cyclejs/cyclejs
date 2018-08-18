import xs, {Stream, InternalListener, OutSender, Operator, NO} from 'xstream';
import {InternalInstances} from './types';

class PickCombineListener<Si, T>
  implements InternalListener<T>, OutSender<Array<T>> {
  private key: string;
  public out: Stream<Array<T>>;
  public p: PickCombine<Si, T>;
  public val: T;
  public ins: Stream<T>;

  constructor(
    key: string,
    out: Stream<Array<T>>,
    p: PickCombine<Si, T>,
    ins: Stream<T>
  ) {
    this.key = key;
    this.out = out;
    this.p = p;
    this.val = NO as any;
    this.ins = ins;
  }

  public _n(t: T): void {
    const p = this.p,
      out = this.out;
    this.val = t;
    if (out === null) {
      return;
    }
    this.p.up();
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

class PickCombine<Si, R> implements Operator<InternalInstances<Si>, Array<R>> {
  public type = 'combine';
  public ins: Stream<InternalInstances<Si>>;
  public out: Stream<Array<R>>;
  public sel: string;
  public ils: Map<string, PickCombineListener<Si, R>>;
  public inst: InternalInstances<Si>;

  constructor(sel: string, ins: Stream<InternalInstances<Si>>) {
    this.ins = ins;
    this.sel = sel;
    this.out = null as any;
    this.ils = new Map();
    this.inst = null as any;
  }

  public _start(out: Stream<Array<R>>): void {
    this.out = out;
    this.ins._add(this);
  }

  public _stop(): void {
    this.ins._remove(this);
    const ils = this.ils;
    ils.forEach(il => {
      il.ins._remove(il);
      il.ins = null as any;
      il.out = null as any;
      il.val = null as any;
    });
    ils.clear();
    this.out = null as any;
    this.ils = new Map();
    this.inst = null as any;
  }

  public up(): void {
    const arr = this.inst.arr;
    const n = arr.length;
    const ils = this.ils;
    const outArr: Array<R> = Array(n);
    for (let i = 0; i < n; ++i) {
      const sinks = arr[i];
      const key = (sinks._key as any) as string;
      if (!ils.has(key)) {
        return;
      }
      const val = (ils.get(key) as any).val;
      if (val === NO) {
        return;
      }
      outArr[i] = val;
    }
    this.out._n(outArr);
  }

  public _n(inst: InternalInstances<Si>): void {
    this.inst = inst;
    const arrSinks = inst.arr;
    const ils = this.ils;
    const out = this.out;
    const sel = this.sel;
    const dict = inst.dict;
    const n = arrSinks.length;
    // remove
    let removed = false;
    ils.forEach((il, key) => {
      if (!dict.has(key)) {
        il.ins._remove(il);
        il.ins = null as any;
        il.out = null as any;
        il.val = null as any;
        ils.delete(key);
        removed = true;
      }
    });
    if (n === 0) {
      out._n([]);
      return;
    }
    // add
    for (let i = 0; i < n; ++i) {
      const sinks = arrSinks[i];
      const key = (sinks._key as any) as string;
      if (!sinks[sel]) {
        throw new Error('pickCombine found an undefined child sink stream');
      }
      const sink: Stream<any> = xs.fromObservable(sinks[sel]);
      if (!ils.has(key)) {
        ils.set(key, new PickCombineListener(key, out, this, sink));
        sink._add(ils.get(key) as PickCombineListener<Si, R>);
      }
    }
    if (removed) {
      this.up();
    }
  }

  public _e(e: any): void {
    const out = this.out;
    if (out === null) {
      return;
    }
    out._e(e);
  }

  public _c(): void {
    const out = this.out;
    if (out === null) {
      return;
    }
    out._c();
  }
}

export function pickCombine(selector: string) {
  return function pickCombineOperator(
    inst$: Stream<InternalInstances<any>>
  ): Stream<Array<any>> {
    return new Stream(new PickCombine(selector, inst$));
  };
}
