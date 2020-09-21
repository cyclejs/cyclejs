import type { Main, Scope } from '@cycle/run';

export type Scopes = Scope | Record<string, Scope | null>;

export function isolate(main: Main, scope: Scopes): Main {
  checkArguments(main, scope);

  return function isolatedMain(sources: any, ...rest: any[]) {
    let channelsToIsolate: any = {};

    for (const name of Object.keys(sources)) {
      if (typeof sources[name]?.isolateSource !== 'undefined') {
        if (typeof scope !== 'object') {
          channelsToIsolate[name] = scope;
        } else if (defined(scope[name])) {
          channelsToIsolate[name] = scope[name];
        } else if (scope[name] === undefined && defined(scope['*'])) {
          channelsToIsolate[name] = scope['*'];
        }
      }
    }

    let newSources: any = {};
    for (const name of Object.keys(channelsToIsolate)) {
      newSources[name] = sources[name].isolateSource(channelsToIsolate[name]);
    }

    const sinks = main({ ...sources, ...newSources }, ...rest);

    let newSinks: any = {};
    for (const name of Object.keys(channelsToIsolate)) {
      if (!sinks[name]) continue;
      newSinks[name] = sources[name].isolateSink(
        sinks[name],
        channelsToIsolate[name]
      );
    }

    return { ...sinks, ...newSinks };
  };
}

function checkArguments(main: Main, scope: Scopes): void {
  if (typeof main !== 'function') {
    throw new Error(
      'First argument given to isolate() must be a main function'
    );
  }
  if (scope === null) {
    throw new Error('Second argument given to isolate() must not be null');
  }
}

function defined(x: any): boolean {
  return x !== null && x !== undefined;
}
