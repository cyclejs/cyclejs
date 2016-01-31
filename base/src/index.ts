export interface Observer {
  next: (x: any) => void;
  error: (e: any) => void;
  complete: (c?: any) => void;
}

export interface DriverFunction {
  (stream: any, adaptFn: Function, driverName: string): any;
  streamAdapter?: StreamAdapter;
}

export interface DriversDefinition {
  [driverName: string]: DriverFunction;
}

export interface HoldSubject {
  stream: any;
  observer: Observer;
}

export interface SinkProxies {
  [driverName: string]: HoldSubject;
}

export type DisposeFunction = () => void

export type StreamSubscribe = (stream: any, observer: Observer) => DisposeFunction | void

export interface StreamAdapter {
  adapt: (originStream: any, originStreamSubscribe: StreamSubscribe) => any;
  dispose: (sinks: any, sinkProxies: SinkProxies, sources: any) => void;
  makeHoldSubject: () => HoldSubject;
  isValidStream: (stream: any) => boolean;
  streamSubscribe: StreamSubscribe;
}

export interface CycleOptions {
 streamAdapter: StreamAdapter;
}

export interface CycleExecution<Sources, Sinks> {
  sources: Sources;
  sinks: Sinks;
  run: () => DisposeFunction;
}

function makeSinkProxies(drivers: DriversDefinition,
                         streamAdapter: StreamAdapter): SinkProxies {
  const sinkProxies: SinkProxies = {};
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      const holdSubject = streamAdapter.makeHoldSubject();
      const driverStreamAdapter = drivers[name].streamAdapter || streamAdapter;

      const stream = driverStreamAdapter.adapt(
        holdSubject.stream,
        streamAdapter.streamSubscribe
      );

      sinkProxies[name] = {
        stream,
        observer: holdSubject.observer,
      };
    }
  }
  return sinkProxies;
}

function callDrivers(drivers: DriversDefinition,
                     sinkProxies: SinkProxies,
                     streamAdapter: StreamAdapter): any {
  const sources = {};
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      sources[name] = drivers[name](
        sinkProxies[name].stream,
        streamAdapter.adapt,
        name
      );
    }
  }
  return sources;
}

function replicateMany(sinks: any,
                       sinkProxies: SinkProxies,
                       streamAdapter: StreamAdapter): DisposeFunction {
  const results: Array<DisposeFunction | void> = Object.keys(sinks)
    .filter(name => !!sinkProxies[name])
    .map(name =>
      streamAdapter.streamSubscribe(sinks[name], sinkProxies[name].observer)
    );
  const disposeFunctions: Array<DisposeFunction> = <Array<DisposeFunction>> results
    .filter(dispose => typeof dispose === 'function');
  return () => {
    disposeFunctions.forEach(dispose => dispose());
  };
}

function disposeSources<Sources>(sources: Sources) {
  for (let k in sources) {
    if (sources.hasOwnProperty(k) && typeof sources[k].dispose === 'function') {
      sources[k].dispose();
    }
  }
}

const isObjectEmpty = (obj: any) => Object.keys(obj).length === 0;

function Cycle<Sources, Sinks>(main: (sources: Sources) => Sinks,
                               drivers: DriversDefinition,
                               options: CycleOptions): CycleExecution<Sources, Sinks> {
  if (typeof main !== `function`) {
    throw new Error(`First argument given to Cycle must be the 'main' ` +
      `function.`);
  }
  if (typeof drivers !== `object` || drivers === null) {
    throw new Error(`Second argument given to Cycle must be an object ` +
      `with driver functions as properties.`);
  }
  if (isObjectEmpty(drivers)) {
    throw new Error(`Second argument given to Cycle must be an object ` +
      `with at least one driver function declared as a property.`);
  }
  const streamAdapter = options.streamAdapter;
  if (!streamAdapter || isObjectEmpty(streamAdapter)) {
    throw new Error(`Third argument given to Cycle must be an options object ` +
      `with the streamAdapter key supplied with a valid stream adapter.`);
  }

  const sinkProxies: SinkProxies = makeSinkProxies(drivers, streamAdapter);
  const sources: Sources = callDrivers(drivers, sinkProxies, streamAdapter);
  const sinks: Sinks = main(sources);
  const run: () => DisposeFunction = () => {
    const disposeReplication = replicateMany(sinks, sinkProxies, streamAdapter);
    return () => {
      streamAdapter.dispose(sinks, sinkProxies, sources);
      disposeSources(sources);
      disposeReplication();
    };
  };
  return {sinks, sources, run};
}

export default Cycle;
