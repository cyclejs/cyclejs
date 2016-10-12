import {Operator, Stream} from 'xstream';

class TimeSpreadOperator<T> implements Operator<T, Array<T>> {
  public type = 'timeSpread';
  public ins: Stream<T>;
  public out: Stream<Array<T>>;
  private DURATION_AS_NORMAL: number; // milliseconds
  private DURATION_AS_FAST: number; // milliseconds
  private period: number;
  private queue: Array<T>;
  private timeoutId: any;
  private intervalId: any;

  constructor(period: number, ins: Stream<T>) {
    this.ins = ins;
    this.out = null;
    this.period = period;
    this.queue = [];
    this.timeoutId = null;
    this.intervalId = null;
    this.DURATION_AS_NORMAL = 8 * period;
    this.DURATION_AS_FAST = 28 * period;
  }

  _start(out: Stream<Array<T>>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.queue = [];
    this.timeoutId = null;
    this.intervalId = null;
  }

  clearInterval() {
    const id = this.intervalId;
    if (id !== null) {
      clearInterval(id);
      this.intervalId = null;
    }
  }

  clearTimeout() {
    const id = this.timeoutId;
    if (id !== null) {
      clearTimeout(id);
      this.timeoutId = null;
    }
  }

  _n(t: T) {
    const u = this.out;
    if (!u) {
      return;
    }
    this.queue.push(t);
    this.clearTimeout();
    this.timeoutId = setTimeout(() => this.schedule(), 16);
  }

  schedule() {
    const u = this.out;
    if (!u) {
      return;
    }
    const q = this.queue;
    const duration = q.length * this.period;
    if (q.length === 0) {
      return;
    } else if (q.length === 1) {
      u._n([q.shift()]);
    } else if (duration <= this.DURATION_AS_NORMAL) {
      this.scheduleAsNormal();
    } else if (duration <= this.DURATION_AS_FAST) {
      this.scheduleAsFast(this.DURATION_AS_NORMAL / q.length);
    } else {
      this.scheduleAsInstant(this.DURATION_AS_FAST / q.length);
    }
  }

  scheduleAsNormal() {
    this.clearInterval();
    const u = this.out;
    const q = this.queue;
    const period = this.period;

    u._n([q.shift()]);
    let consumedLength = 1;

    this.intervalId = setInterval(() => {
      const wouldBeLength = consumedLength + q.length;
      const wouldBeDuration = wouldBeLength * period;
      if (q.length === 0) {
        this.clearInterval();
      } else if (wouldBeDuration <= this.DURATION_AS_NORMAL) {
        u._n([q.shift()]);
        consumedLength += 1;
      } else if (wouldBeDuration <= this.DURATION_AS_FAST) {
        this.scheduleAsFast(this.DURATION_AS_NORMAL / wouldBeLength);
      } else {
        this.scheduleAsInstant(this.DURATION_AS_FAST / wouldBeLength);
      }
    }, period);
  }

  scheduleAsFast(fastPeriod: number) {
    this.clearInterval();
    const u = this.out;
    const q = this.queue;

    u._n([q.shift()]);
    let consumedLength = 1;

    this.intervalId = setInterval(() => {
      const wouldBeLength = consumedLength + q.length;
      const wouldBeDuration = wouldBeLength * fastPeriod;
      if (q.length === 0) {
        this.clearInterval();
      } else if (wouldBeDuration <= this.DURATION_AS_FAST) {
        u._n([q.shift()]);
        consumedLength += 1;
      } else {
        this.scheduleAsInstant(this.DURATION_AS_FAST / wouldBeLength);
      }
    }, fastPeriod);
  }

  scheduleAsInstant(instantPeriod: number) {
    this.clearInterval();
    const u = this.out;
    const q = this.queue;

    this.intervalId = setInterval(() => {
      if (q.length === 0) {
        this.clearInterval();
      } else {
        // let consumed = 0;
        const toBeConsumed = Math.ceil(q.length / 4);
        // while (consumed < toBeConsumed && q.length > 0) {
          u._n(q.splice(0, toBeConsumed));
          // u._n([q.shift()]);
          // consumed++;
        // }
        if (q.length === 0) {
          this.clearInterval();
        }
      }
    }, 16);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) {
      return;
    }
    this.clearInterval();
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) {
      return;
    }
    this.clearInterval();
    u._c();
  }
}

export default function timeSpread<T>(period: number): (ins: Stream<T>) => Stream<Array<T>> {
  return function timeSpreadOperator(ins: Stream<T>) {
    return new Stream<Array<T>>(new TimeSpreadOperator(period, ins));
  };
}
