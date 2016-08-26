export interface Observer<T> {
  next: (x: T) => void;
  error: (e: any) => void;
  complete: (c?: T) => void;
}

export interface Subject<T> {
  stream: any;
  observer: Observer<T>;
}

export interface SinkProxies {
  [driverName: string]: Subject<any>;
}

export type DisposeFunction = () => void

export type StreamSubscribe = <T>(stream: any, observer: Observer<T>) => DisposeFunction | void

export interface DevToolEnabledSource {
  _isCycleSource: string;
}

export interface StreamAdapter {
  adapt: <T>(originStream: any, originStreamSubscribe: StreamSubscribe) => any;
  remember: <T>(stream: any) => any;
  makeSubject: <T>() => Subject<T>;
  isValidStream: (stream: any) => boolean;
  streamSubscribe: StreamSubscribe;
}

export interface DriverFunction {
  (stream: any, adapter: StreamAdapter, driverName: string): any;
  streamAdapter?: StreamAdapter;
}

export interface DriversDefinition {
  [driverName: string]: DriverFunction;
}

export interface CycleOptions {
 streamAdapter: StreamAdapter;
}

export interface CycleExecution<Sources, Sinks> {
  sources: Sources;
  sinks: Sinks;
  run: () => DisposeFunction;
}

export interface CycleSetup {
  (main: (sources: any) => any, drivers: {[name: string]: Function}): CycleExecution<any, any>;
  run: (main: (sources: any) => any, drivers: {[name: string]: Function}) => DisposeFunction;
}

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

function makeSinkProxies(drivers: DriversDefinition,
                         streamAdapter: StreamAdapter): SinkProxies {
  const sinkProxies: SinkProxies = {};
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      const holdSubject = streamAdapter.makeSubject();
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
      const driverOutput = drivers[name](
        sinkProxies[name].stream,
        streamAdapter,
        name
      );

      const driverStreamAdapter = drivers[name].streamAdapter;

      if (driverStreamAdapter && driverStreamAdapter.isValidStream(driverOutput)) {
        sources[name] = streamAdapter.adapt(
          driverOutput,
          driverStreamAdapter.streamSubscribe
        );
      } else {
        sources[name] = driverOutput;
      }
      if (sources[name] && typeof sources[name] === 'object') {
        (<DevToolEnabledSource> sources[name])._isCycleSource = name;
      }
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
      streamAdapter.streamSubscribe(sinks[name], {
        next(x: any) { sinkProxies[name].observer.next(x); },
        error(err: any) {
          logToConsoleError(err);
          sinkProxies[name].observer.error(err);
        },
        complete(x?: any) {
          sinkProxies[name].observer.complete(x);
        }
      })
    );
  const disposeFunctions: Array<DisposeFunction> = <Array<DisposeFunction>> results
    .filter(dispose => typeof dispose === 'function');
  return () => {
    disposeFunctions.forEach(dispose => dispose());
  };
}

function disposeSources<Sources>(sources: Sources) {
  for (let k in sources) {
    if (sources.hasOwnProperty(k) && sources[k]
      && typeof sources[k].dispose === 'function') {
      sources[k].dispose();
    }
  }
}

const isObjectEmpty = (obj: any) => Object.keys(obj).length === 0;

function Cycle<Sources, Sinks>(main: (sources: Sources) => Sinks,
                               drivers: {[name: string]: Function},
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

  const sinkProxies: SinkProxies = makeSinkProxies(<DriversDefinition> drivers, streamAdapter);
  const sources: Sources = callDrivers(<DriversDefinition> drivers, sinkProxies, streamAdapter);
  const sinks: Sinks = main(sources);
  if (typeof window !== 'undefined') {
    (<any> window).Cyclejs = {sinks};
  }
  const run: () => DisposeFunction = () => {
    const disposeReplication = replicateMany(sinks, sinkProxies, streamAdapter);
    return () => {
      disposeSources(sources);
      disposeReplication();
    };
  };
  return {sinks, sources, run};
}

export default Cycle;
