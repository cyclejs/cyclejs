import {Stream} from 'xstream';

export interface Scope {
  type: string;
  payload: any;
}

export const defaultIsolationType = 'DEFAULT_ISOLATION';
export const siblingIsolationType = 'SIBLING_ISOLATION';
export const totalIsolationType = 'TOTAL_ISOLATION';

export interface DefaultIsolation extends Scope {
  type: typeof defaultIsolationType;
  payload: string;
}

export interface SiblingIsolation extends Scope {
  type: typeof siblingIsolationType;
  payload: string;
}

export interface TotalIsolation extends Scope {
  type: typeof totalIsolationType;
  payload: string;
}

export interface IsolatedSource {
  isolateSource(source: Object, scope: any): Object;
  isolateSink(sink: Stream<any>, scope: any): Stream<any>;
}

export function defaultIsolation(key: string): DefaultIsolation {
  return {
    type: defaultIsolationType,
    payload: key,
  };
}
export function siblingIsolation(key: string): SiblingIsolation {
  return {
    type: siblingIsolationType,
    payload: key,
  };
}
export function totalIsolation(key: string): TotalIsolation {
  return {
    type: totalIsolationType,
    payload: key,
  };
}

export type Isolation = DefaultIsolation | SiblingIsolation | TotalIsolation;

export type Component = (so: any, ...rest: any[]) => any;

export function isolate(
  component: Component,
  scopes: Scope | Record<string, Scope>,
): Component {
  if (!scopes) {
    throw new Error('scope is not allowed to be a falsy value');
  }
  if (typeof component !== 'function') {
    throw new Error(
      "First argument given to isolate() must be a 'dataflowComponent' function",
    );
  }

  return function(sources: any, ...rest: any[]): any {
    const channels = Object.keys(sources);

    const scopeGetter = makeScopeGetter(scopes);

    const isolatedSources = Object.keys(sources)
      .map(k => {
        const scope = scopeGetter(k);
        if (
          scope === null ||
          sources[k] === undefined ||
          sources[k].isolateSource === undefined
        ) {
          return {[k]: sources[k]};
        }
        return {[k]: sources[k].isolateSource(sources[k], scope)};
      })
      .reduce(reassemble, {});

    const sinks = component(isolatedSources, ...rest);

    return Object.keys(sinks)
      .map(k => {
        const scope = scopeGetter(k);
        if (
          scope === null ||
          sources[k] === undefined ||
          sources[k].isolateSink === undefined
        ) {
          return {[k]: sinks[k]};
        }
        return {[k]: sources[k].isolateSink(sinks[k], scope)};
      })
      .reduce(reassemble, {});
  };
}

function reassemble(acc: Object, curr: Object): Object {
  return {...acc, ...curr};
}

function makeScopeGetter(
  scopes: Scope | Record<string, Scope>,
): (k: string) => Scope | null {
  return function(key: string) {
    if (typeof (scopes as any).type !== 'undefined') {
      return scopes;
    }
    if (typeof scopes[key] !== 'undefined') {
      return scopes[key];
    }
    if (typeof scopes['*'] !== 'undefined') {
      return scopes['*'];
    }
    return null;
  };
}
