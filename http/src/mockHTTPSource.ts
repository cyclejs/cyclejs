import xs, {Stream, MemoryStream} from 'xstream';
import {DevToolEnabledSource, FantasyObservable} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {
  HTTPSource,
  RequestOptions,
  RequestInput,
  Response,
  ResponseStream,
} from './interfaces';
import {isolateSource, isolateSink} from './isolate';

export type MockHTTPConfig = {
  [name: string]: FantasyObservable<any> | MockHTTPConfig;
};

const SCOPE_PREFIX = '___';

function isObservableLike(value: any): boolean {
  return (
    Boolean(value) &&
    (typeof value.addListener === 'function' ||
      typeof value.subscribe === 'function' ||
      typeof value['@@observable'] === 'function')
  );
}

function ensureResponseStream(
  rawResponse$: any,
  category?: string,
  namespace: Array<string> = []
): MemoryStream<Response> & ResponseStream {
  const stream$: Stream<any> = isObservableLike(rawResponse$)
    ? xs.fromObservable(rawResponse$)
    : xs.of(rawResponse$);

  const existingReq: Partial<RequestOptions> =
    (rawResponse$ && rawResponse$.request) || {};

  const reqOptions: RequestOptions = {
    url: existingReq.url || '',
    ...existingReq,
    ...(category && !existingReq.category ? {category} : {}),
    _namespace: existingReq._namespace || namespace,
  };

  const mapped$ = stream$
    .map((res: any) => {
      if (res && typeof res === 'object' && !res.request) {
        return {
          ...res,
          request: reqOptions,
        };
      }
      return res;
    })
    .remember();

  const adapted$: any = adapt(mapped$);
  if (!adapted$.request) {
    Object.defineProperty(adapted$, 'request', {
      value: reqOptions,
      writable: false,
    });
  }
  return adapted$ as MemoryStream<Response> & ResponseStream;
}

function buildResponseMetastream(
  config: MockHTTPConfig | FantasyObservable<any>,
  namespace: Array<string> = []
): Stream<MemoryStream<Response> & ResponseStream> {
  if (!config) {
    return xs.empty();
  }
  if (isObservableLike(config)) {
    return xs
      .fromObservable<any>(config as FantasyObservable<any>)
      .map(res$ => ensureResponseStream(res$, undefined, namespace));
  }

  const streams: Array<Stream<MemoryStream<Response> & ResponseStream>> = [];
  const keys = Object.keys(config);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const entry = (config as MockHTTPConfig)[key];
    if (!entry) {
      continue;
    }
    if (isObservableLike(entry)) {
      const category = key === '*' || key === 'default' ? undefined : key;
      const stream$$ = xs
        .fromObservable<any>(entry as FantasyObservable<any>)
        .map(res$ => ensureResponseStream(res$, category, namespace));
      streams.push(stream$$);
    } else if (typeof entry === 'object') {
      const cleanScope =
        key.indexOf('.' + SCOPE_PREFIX) === 0
          ? key.slice(1 + SCOPE_PREFIX.length)
          : key.indexOf(SCOPE_PREFIX) === 0
          ? key.slice(SCOPE_PREFIX.length)
          : key;
      streams.push(
        buildResponseMetastream(
          entry as MockHTTPConfig,
          namespace.concat(cleanScope)
        )
      );
    }
  }

  return streams.length > 0 ? xs.merge(...streams) : xs.empty();
}

export class MockedHTTPSource implements HTTPSource {
  private _res$$: Stream<MemoryStream<Response> & ResponseStream>;

  constructor(
    private _mockConfig: MockHTTPConfig | FantasyObservable<any> = {},
    private _name: string = 'MockedHTTP',
    public _namespace: Array<string> = [],
    res$$?: Stream<MemoryStream<Response> & ResponseStream>
  ) {
    this._res$$ = res$$ || buildResponseMetastream(_mockConfig, _namespace);
  }

  public filter(
    predicate: (request: RequestOptions) => boolean,
    scope?: string
  ): HTTPSource {
    const filteredResponse$$ = this._res$$.filter(r$ => predicate(r$.request));
    return new MockedHTTPSource(
      this._mockConfig,
      this._name,
      scope === undefined ? this._namespace : this._namespace.concat(scope),
      filteredResponse$$
    );
  }

  public select(category?: string): any {
    if (
      category &&
      this._mockConfig &&
      !isObservableLike(this._mockConfig) &&
      typeof (this._mockConfig as MockHTTPConfig)[category] === 'object' &&
      !isObservableLike((this._mockConfig as MockHTTPConfig)[category])
    ) {
      return new MockedHTTPSource(
        (this._mockConfig as MockHTTPConfig)[category] as MockHTTPConfig,
        this._name,
        this._namespace.concat(category)
      );
    }

    const res$$ = category
      ? this._res$$.filter(
          res$ => res$.request && res$.request.category === category
        )
      : this._res$$;
    const out: DevToolEnabledSource = adapt(res$$);
    out._isCycleSource = this._name;
    return out;
  }

  public isolateSource(
    source: HTTPSource,
    scope: string | null
  ): HTTPSource {
    if (scope === null) {
      return source;
    }
    if (
      source instanceof MockedHTTPSource &&
      source._mockConfig &&
      !isObservableLike(source._mockConfig)
    ) {
      const cfg = source._mockConfig as MockHTTPConfig;
      const scopedCfg =
        cfg['.' + SCOPE_PREFIX + scope] ||
        cfg[SCOPE_PREFIX + scope] ||
        cfg[scope];
      if (scopedCfg && !isObservableLike(scopedCfg)) {
        return new MockedHTTPSource(
          scopedCfg as MockHTTPConfig,
          source._name,
          source._namespace.concat(scope)
        );
      }
    }
    return isolateSource(source, scope);
  }

  public isolateSink: (
    request$: Stream<RequestInput | string>,
    scope: string | null
  ) => Stream<RequestInput> = isolateSink;
}

export function mockHTTPSource(
  mockConfig: MockHTTPConfig | FantasyObservable<any> = {},
  name: string = 'MockedHTTP'
): HTTPSource {
  return new MockedHTTPSource(mockConfig, name);
}
