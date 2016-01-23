export interface Observer {
  next: (x: any) => void;
  error: (e: any) => void;
  complete: (x: any) => void;
};

export type StreamSubscriber = (stream: any, observer: Observer) => void;

export interface StreamAdapter {
  makeHoldSubject: () => any;
  dispose: (sinks: any, sinkProxies: any, sources: any) => void;
  replicate: (stream: any, observer: Observer) => void;
  isValidStream: (stream: any) => boolean;
  subscribeToStream: StreamSubscriber;
  adapt: (originStream: any, subscribeToOriginStream: StreamSubscriber) => any;
};

function makeSinkProxies(drivers: any, CycleStreamAdapter: StreamAdapter): any {
  const sinkProxies = {};
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      const holdSubject = CycleStreamAdapter.makeHoldSubject();
      const driverStreamAdapter = drivers[name].streamAdapter || CycleStreamAdapter;

      const stream = driverStreamAdapter.adapt(
        holdSubject.stream,
        driverStreamAdapter.subscribeToStream
      );

      sinkProxies[name] = {
        stream,
        observer: holdSubject.observer,
      };
    }
  }
  return sinkProxies;
}

function callDrivers(drivers: any, sinkProxies: any, CycleStreamAdapter: StreamAdapter): any {
  const sources = {};
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      const driverStreamAdapter = drivers[name].streamAdapter || CycleStreamAdapter;
      const adapt = (stream: any) => CycleStreamAdapter.adapt(
        stream,
        driverStreamAdapter.subscribeToStream
      );
      sources[name] = drivers[name](sinkProxies[name].stream, adapt, name);
    }
  }
  return sources;
}

function replicateMany(sinks: any, sinkProxies: any, CycleStreamAdapter: StreamAdapter): void {
  Object.keys(sinks)
    .filter(name => sinkProxies[name])
    .forEach(name => {
      CycleStreamAdapter.replicate(sinks[name], sinkProxies[name].observer);
    });
}

export interface DriverFunction {
  (stream: any, adaptFn: Function, driverName: string): any;
  streamAdapter?: StreamAdapter;
}

export interface DriversDefinition {
  [driverName: string]: DriverFunction;
}

const isObjectEmpty = (obj: any) => Object.keys(obj).length === 0;

function Cycle<Sinks, Sources>(
  main: (sources: Sources) => Sinks,
  drivers: DriversDefinition,
  {streamAdapter}: {streamAdapter: StreamAdapter}) {
  if (typeof main !== `function`) {
    throw new Error(`First argument given to Cycle() must be the 'main' ` +
      `function.`);
  }
  if (typeof drivers !== `object` || drivers === null) {
    throw new Error(`Second argument given to Cycle() must be an object ` +
      `with driver functions as properties.`);
  }
  if (isObjectEmpty(drivers)) {
    throw new Error(`Second argument given to Cycle() must be an object ` +
      `with at least one driver function declared as a property.`);
  }
  if (!streamAdapter || isObjectEmpty(streamAdapter)) {
    throw new Error(`Third argument given to Cycle() must be an object ` +
      `with the streamAdapter key supplied with a valid stream adapter.`);
  }

  const sinkProxies = makeSinkProxies(drivers, streamAdapter);
  const sources = callDrivers(drivers, sinkProxies, streamAdapter);
  const sinks = main(sources);

  const run = () => {
    replicateMany(sinks, sinkProxies, streamAdapter);
    return () => streamAdapter.dispose(sinks, sinkProxies, sources);
  };

  return {sinks, sources, run};
}

export default Cycle
