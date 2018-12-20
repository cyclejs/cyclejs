import xs, {Stream} from 'xstream';
import quicktask from 'quicktask';
import {adapt} from './adapt';
import {
  DevToolEnabledSource,
  DisposeFunction,
  Drivers,
  SinkProxies,
  Sources,
} from './types';

const scheduleMicrotask = quicktask();

export function makeSinkProxies<D extends Drivers>(drivers: D): SinkProxies<D> {
  const sinkProxies: SinkProxies<D> = {} as SinkProxies<D>;
  for (const name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      sinkProxies[name] = xs.create<any>();
    }
  }
  return sinkProxies;
}

export function callDrivers<D extends Drivers>(
  drivers: D,
  sinkProxies: SinkProxies<D>
): Sources<D> {
  const sources: Sources<D> = {} as Sources<D>;
  for (const name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      sources[name as any] = (drivers[name] as any)(sinkProxies[name], name);
      if (sources[name as any] && typeof sources[name as any] === 'object') {
        (sources[name as any] as DevToolEnabledSource)._isCycleSource = name;
      }
    }
  }
  return sources;
}

// NOTE: this will mutate `sources`.
export function adaptSources<So>(sources: So): So {
  for (const name in sources) {
    if (
      sources.hasOwnProperty(name) &&
      sources[name] &&
      typeof ((sources[name] as any) as Stream<any>).shamefullySendNext ===
        'function'
    ) {
      sources[name] = adapt((sources[name] as any) as Stream<any>);
    }
  }
  return sources;
}

/**
 * Notice that we do not replicate 'complete' from real sinks, in
 * SinksReplicators and ReplicationBuffers.
 * Complete is triggered only on disposeReplication. See discussion in #425
 * for details.
 */
type SinkReplicators<Si> = {
  [P in keyof Si]: {
    next(x: any): void;
    _n?(x: any): void;
    error(err: any): void;
    _e?(err: any): void;
    complete(): void;
  }
};

type ReplicationBuffers<Si> = {
  [P in keyof Si]: {
    _n: Array<any>;
    _e: Array<any>;
  }
};

export function replicateMany<Si extends any>(
  sinks: Si,
  sinkProxies: SinkProxies<Si>
): DisposeFunction {
  const sinkNames: Array<keyof Si> = Object.keys(sinks).filter(
    name => !!sinkProxies[name]
  );

  let buffers: ReplicationBuffers<Si> = {} as ReplicationBuffers<Si>;
  const replicators: SinkReplicators<Si> = {} as SinkReplicators<Si>;
  sinkNames.forEach(name => {
    buffers[name] = {_n: [], _e: []};
    replicators[name] = {
      next: (x: any) => buffers[name]._n.push(x),
      error: (err: any) => buffers[name]._e.push(err),
      complete: () => {},
    };
  });

  const subscriptions = sinkNames.map(name =>
    xs.fromObservable(sinks[name] as any).subscribe(replicators[name])
  );

  sinkNames.forEach(name => {
    const listener = sinkProxies[name];
    const next = (x: any) => {
      scheduleMicrotask(() => listener._n(x));
    };
    const error = (err: any) => {
      scheduleMicrotask(() => {
        (console.error || console.log)(err);
        listener._e(err);
      });
    };
    buffers[name]._n.forEach(next);
    buffers[name]._e.forEach(error);
    replicators[name].next = next;
    replicators[name].error = error;
    // because sink.subscribe(replicator) had mutated replicator to add
    // _n, _e, _c, we must also update these:
    replicators[name]._n = next;
    replicators[name]._e = error;
  });
  buffers = null as any; // free up for GC

  return function disposeReplication() {
    subscriptions.forEach(s => s.unsubscribe());
  };
}

export function disposeSinkProxies<Si>(sinkProxies: SinkProxies<Si>) {
  Object.keys(sinkProxies).forEach(name => sinkProxies[name]._c());
}

export function disposeSources<So>(sources: So) {
  for (const k in sources) {
    if (
      sources.hasOwnProperty(k) &&
      sources[k] &&
      (sources[k] as any).dispose
    ) {
      (sources[k] as any).dispose();
    }
  }
}

export function isObjectEmpty(obj: any): boolean {
  return Object.keys(obj).length === 0;
}
