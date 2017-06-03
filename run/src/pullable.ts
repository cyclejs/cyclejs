import xs, {Stream, Listener, Producer} from 'xstream';

export interface Pullable<TRequest, TReply> {
  pull(request: TRequest): Promise<TReply>;
  canProduce(): boolean;
}

export interface PullableValue<T> extends Pullable<void, T> {
  pull(): Promise<T>;
}

export function ConstantValue<T>(c: T): PullableValue<T> {
  const pull = async () => c;
  return { pull, canProduce: () => true };
}

interface DeferredPull<T> {
  resolve(v: T): void;
  reject(err?: any): void;
}

/**
 * A function that creates pullable value, fed by given stream and an optional
 * initial value. It can be thought of as a memory cell.
 * @param {Stream<T>} newValue$ is a stream that feeds new values into created
 * pullable
 * @param {T} initValue is an optional initial value. If this argument is not
 * given, first value will be resolvable upon the first feeding event. If this
 * argument is given and is undefined, value is considered to be set to
 * undefined.
 * @return {Pullable<T>} a pullable value, that is fed by given stream and an
 * optional initial value.
 * @function PullableValue
 */
export function ChangingValue<T>(
                            newValue$: Stream<T>,
                            initValue?: T): PullableValue<T> {
  let v: T;
  let isSet = (arguments.length > 1);
  if (isSet) { v = initValue!; }
  let deferredPulls: DeferredPull<T>[]|undefined;
  function canProduce(): boolean {
    return (isSet || !!deferredPulls);
  }

  async function pull(): Promise<T> {
    if (!canProduce()) { throw new Error('Pullable cannot produce values'); }
    if (isSet) { return v; }
    return new Promise<T>((resolve, reject) => {
      if (!deferredPulls) { deferredPulls = []; }
      deferredPulls.push({resolve, reject});
    });
  };

  newValue$.subscribe({
    next: newValue => {
      v = newValue;
      if (isSet) { return; }
      isSet = true;
      resolveDeferredPulls();
    },
    complete: () => {
      isSet = false;
      rejectDeferredPulls(new Error(
          'Value source completed and detached without giving any value'));
    },
    error: err => {
      isSet = false;
      rejectDeferredPulls(err);
    },
  });

  // resolving of deferreds is done FIFO, each "on the next tick"
  function resolveDeferredPulls(): void {
    if (!deferredPulls) { return; }
    setTimeout(() => {
      const deferredPull = deferredPulls!.shift();
      if (deferredPull) {
        deferredPull.resolve(v);
        resolveDeferredPulls();
      }
      deferredPulls = undefined;
    }, 0);
  };

  function rejectDeferredPulls(err: any): void {
    if (!deferredPulls) { return; }
    for (const deferredPull of deferredPulls) {
      deferredPull.reject(err);
    }
    deferredPulls = undefined;
  };

  return { pull, canProduce };
}

/**
 * A function that creates pullable backed by some producer circuit.
 * Consumer's pull is producer's push. This particular pullable pushes
 * underlying producer in the following manner. Request N+1 is turned into
 * producer's push only when reply is produced to request N. For a lack of
 * better name, we call this strategy atomic, hence name it atomic pullable.
 * @return {object} an object with three fields:
 * (1) pullable {Pullable<TRequest, TReply>} is a pullable to be backed by some
 * producer circuit, driven by request stream,
 * (2) request$ {Stream<TRequest>} is a request stream, with incoming pull
 * requests, and
 * (3) replySink {Listener<TReply>} is sink for producer to provide ready
 * replies.
 * @function AtomicPullable
 */
export function AtomicPullable<T>():
                      { pullable: PullableValue<T>;
                        request$: Stream<void>;
                        replySink: Listener<T>; };
export function AtomicPullable<TRequest, TReply>():
                      { pullable: Pullable<TRequest, TReply>;
                        request$: Stream<TRequest>;
                        replySink: Listener<TReply>; };
export function AtomicPullable<TRequest, TReply>():
                      { pullable: Pullable<TRequest, TReply>;
                        request$: Stream<TRequest>;
                        replySink: Listener<TReply>; } {
  const deferredPulls: {req: TRequest; deferred: DeferredPull<TReply>}[] = [];
  let pullsListener: Listener<TRequest>|undefined;
  function canProduce(): boolean {
    return !!pullsListener;
  }

  async function pull(req: TRequest): Promise<TReply> {
    if (!canProduce()) { throw new Error('Pullable cannot produce values'); }
    const promise = new Promise<TReply>((resolve, reject) => deferredPulls.push(
      { req, deferred: { resolve, reject } }));
    if (deferredPulls.length === 1) {
      pushProducer();
    }
    return promise;
  };

  function pushProducer(): void {
    if (!pullsListener) { return; }
    if (deferredPulls.length > 0) {
      pullsListener.next(deferredPulls[0].req);
    }
  };

  const request$ = xs.create<TRequest>({
    start: listener => { pullsListener = listener; },
    stop: () => { pullsListener = undefined; },
  });

  const replySink: Listener<TReply> = {
    next: rep => {
      const dp = deferredPulls.shift();
      if (!dp) {
        pullsListener = undefined;
        throw new Error('Got reply when there are no outstanding requests. This is fatal ...');
      }
      dp.deferred.resolve(rep);
      pushProducer();
    },
    complete: () => rejectDeferredPulls(new Error(
      'Value source completed and detached without giving any value')),
    error: err => rejectDeferredPulls(err),
  };

  function rejectDeferredPulls(err: any): void {
    for (const deferredPull of deferredPulls) {
      deferredPull.deferred.reject(err);
    }
    deferredPulls.splice(0, deferredPulls.length);
    pullsListener = undefined;
  };

  return { pullable: { pull, canProduce }, request$, replySink };
}

const MIN_SAFE_INTEGER = ((Number as any).MIN_SAFE_INTEGER ?
  (Number as any).MIN_SAFE_INTEGER : -Math.pow(2, 52));
const MAX_SAFE_INTEGER = ((Number as any).MAX_SAFE_INTEGER ?
  (Number as any).MAX_SAFE_INTEGER : Math.pow(2, 52));
function nextCount(currentCount: number): number {
  if (currentCount < MAX_SAFE_INTEGER) { return (currentCount + 1); }
  return MIN_SAFE_INTEGER;
}

/**
 * A function that creates pullable backed by some producer circuit.
 * Consumer's pull is producer's push. This particular pullable pushes
 * underlying producer in the following manner. Request is turned into
 * producer's push as soon as it comes. Replies are guaranteed to come out
 * orderly, i.e. reply to request N will always resolve before reply to request
 * N+1. Yet, this particular implementation only checks that producer circuit
 * sinks replies orderly. If order is broken by producer, this implementation
 * will throw up and explode as hard as possible and refuse to work afterwards.
 * Looking from outside, this works like factory conveyor belt, hence, name it
 * conveyor pullable.
 * @return {object} an object with three fields:
 * (1) pullable {Pullable<TRequest, TReply>} is a pullable to be backed by some
 * producer circuit, driven by request stream,
 * (2) request$ {Stream<{count: number; req: TRequest;}>} is a stream of pairs,
 * containing request count number and incoming request itself, and
 * (3) replySink {Listener<{count: number; rep: TReply;}>} is sink for producer
 * to provide ready replies and corresponding request counts.
 * @function AtomicPullable
 */
export function ConveyorPullable<T>():
                      { pullable: PullableValue<T>;
                        request$: Stream<{count: number; req: void}>;
                        replySink: Listener<{count: number; rep: T}>; };
export function ConveyorPullable<TRequest, TReply>():
                      { pullable: Pullable<TRequest, TReply>;
                        request$: Stream<{count: number; req: TRequest}>;
                        replySink: Listener<{count: number; rep: TReply}>; };
export function ConveyorPullable<TRequest, TReply>():
                      { pullable: Pullable<TRequest, TReply>;
                        request$: Stream<{count: number; req: TRequest}>;
                        replySink: Listener<{count: number; rep: TReply}>; } {
  const deferredPulls: {count: number; req: TRequest;
                        deferred: DeferredPull<TReply>}[] = [];
  let requestCount = MIN_SAFE_INTEGER;
  let replyCount = requestCount;
  let pullsListener: Listener<{count: number; req: TRequest}>|undefined;
  function canProduce(): boolean {
    return !!pullsListener;
  }

  async function pull(req: TRequest): Promise<TReply> {
    if (!canProduce()) { throw new Error('Pullable cannot produce values'); }
    const promise = new Promise<TReply>((resolve, reject) => {
      const count = nextCount(requestCount);
      requestCount = count;
      deferredPulls.push({ count, req, deferred: { resolve, reject } });
    });
    if (deferredPulls.length === 1) {
      pushProducer();
    }
    return promise;
  };

  function pushProducer(): void {
    if (!pullsListener) { return; }
    if (deferredPulls.length > 0) {
      const {count, req} = deferredPulls[0];
      pullsListener.next({count, req});
    }
  };

  const request$ = xs.create<{count: number; req: TRequest}>({
    start: listener => { pullsListener = listener; },
    stop: () => { pullsListener = undefined; },
  });

  const replySink: Listener<{count: number; rep: TReply}> = {
    next: countAndReply => {
      const dp = deferredPulls.shift();
       if (!dp) {
         pullsListener = undefined;
         throw new Error('Got reply when there are no outstanding requests. This is fatal ...');
      }
      const {count, rep} = countAndReply;
      const expectedCount = nextCount(replyCount);
      if (expectedCount !== count) {
        rejectDeferredPulls(new Error('Producer messed up order of replies'));
        return;
      }
      dp.deferred.resolve(rep);
      replyCount = count;
      pushProducer();
    },
    complete: () => rejectDeferredPulls(new Error(
      'Value source completed and detached without giving any value')),
    error: err => rejectDeferredPulls(err),
  };

  function rejectDeferredPulls(err: any): void {
    for (const deferredPull of deferredPulls) {
      deferredPull.deferred.reject(err);
    }
    deferredPulls.splice(0, deferredPulls.length);
    pullsListener = undefined;
  };

  return { pullable: { pull, canProduce }, request$, replySink };
}
