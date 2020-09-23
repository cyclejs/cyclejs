import {
  Subject,
  Producer,
  pipe,
  map,
  flatten,
  filter,
  uponStart,
} from '@cycle/callbags';
import { IdGenerator, IsolateableApi, wrapSubject } from '@cycle/run';
import type { METHOD, ResponseType } from '@minireq/browser';

import type {
  SinkRequest,
  RequestOptions,
  ResponseStream,
  Request,
  Response,
  Scope,
} from './types';

export function makeHttpApi(
  source: Producer<ResponseStream>,
  sinkSubject: Subject<SinkRequest>,
  gen: IdGenerator
): HttpApi {
  return new HttpApi(source, sinkSubject, gen);
}

export class HttpApi implements IsolateableApi<ResponseStream, SinkRequest> {
  constructor(
    public readonly source: Producer<ResponseStream>,
    private sinkSubject: Subject<SinkRequest>,
    private gen: IdGenerator,
    private namespace: Scope[] = []
  ) {}

  get response$$(): Producer<ResponseStream> {
    return this.source;
  }

  public get<
    T = any,
    Type extends ResponseType = 'text',
    Progress extends boolean = false
  >(
    optsOrUrl: string | Request<T, Type, Progress>
  ): Producer<Response<T, Type, Progress>> {
    return this.request(mkOpts('GET', optsOrUrl));
  }

  public post<
    T = any,
    Type extends ResponseType = 'text',
    Progress extends boolean = false
  >(
    optsOrUrl: string | Request<T, Type, Progress>
  ): Producer<Response<T, Type, Progress>> {
    return this.request(mkOpts('POST', optsOrUrl));
  }

  public put<
    T = any,
    Type extends ResponseType = 'text',
    Progress extends boolean = false
  >(
    optsOrUrl: string | Request<T, Type, Progress>
  ): Producer<Response<T, Type, Progress>> {
    return this.request(mkOpts('PUT', optsOrUrl));
  }

  public delete<
    T = any,
    Type extends ResponseType = 'text',
    Progress extends boolean = false
  >(
    optsOrUrl: string | Request<T, Type, Progress>
  ): Producer<Response<T, Type, Progress>> {
    return this.request(mkOpts('DELETE', optsOrUrl));
  }

  public patch<
    T = any,
    Type extends ResponseType = 'text',
    Progress extends boolean = false
  >(
    optsOrUrl: string | Request<T, Type, Progress>
  ): Producer<Response<T, Type, Progress>> {
    return this.request(mkOpts('PATCH', optsOrUrl));
  }

  public request<T = any>(
    options: RequestOptions<any, ResponseType, boolean>
  ): Producer<Response<T, ResponseType, boolean>> {
    const id = this.gen();
    return pipe(
      this.source,
      uponStart(() =>
        this.sinkSubject(1, {
          ...options,
          id,
          namespace: this.namespace,
        })
      ),
      filter(res$ => res$.request.id === id),
      flatten
    );
  }

  public isolateSource(scope: Scope): HttpApi {
    const namespace = this.namespace.concat(scope);

    const source = pipe(
      this.source,
      filter(res$ => isPrefixOf(namespace, res$.request.namespace))
    );

    return new HttpApi(source, this.sinkSubject, this.gen, namespace);
  }

  public isolateSink(
    sink: Producer<SinkRequest>,
    scope: Scope
  ): Producer<SinkRequest> {
    return pipe(
      sink,
      map(req => ({
        ...mkOpts(req.method ?? 'GET', req),
        namespace: [scope].concat(req.namespace ?? []),
      }))
    );
  }

  public create(
    source: Producer<ResponseStream>,
    sinkSubject: Subject<SinkRequest>,
    gen: IdGenerator
  ): HttpApi {
    const stripNamespace = (req: SinkRequest) => {
      if (isPrefixOf(this.namespace, req.namespace)) {
        return {
          ...req,
          namespace: req.namespace!.slice(this.namespace.length),
        };
      } else return req;
    };

    return new HttpApi(
      source,
      wrapSubject(stripNamespace, sinkSubject),
      gen,
      this.namespace
    );
  }
}

function isPrefixOf(prefix: unknown[], arr: unknown[] | undefined): boolean {
  if (!Array.isArray(arr) || arr.length < prefix.length) return false;

  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== arr[i]) {
      return false;
    }
  }
  return true;
}

function mkOpts(
  method: METHOD,
  optsOrUrl: string | Request<any, ResponseType, boolean>
): RequestOptions<any, ResponseType, boolean> {
  if (typeof optsOrUrl === 'string') {
    return { method, url: optsOrUrl };
  } else {
    return { ...optsOrUrl, method };
  }
}
