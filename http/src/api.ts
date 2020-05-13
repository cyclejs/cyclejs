import {
  Subject,
  Producer,
  pipe,
  flatten,
  filter,
  uponStart
} from '@cycle/callbags';
import { IdGenerator } from '@cycle/run';
import { METHOD, ResponseType } from '@minireq/browser';

import {
  SinkRequest,
  RequestOptions,
  ResponseStream,
  Request,
  Response
} from './types';

export function makeHttpApi(
  source: Producer<ResponseStream>,
  sinkSubject: Subject<SinkRequest>,
  gen: IdGenerator
): HttpApi {
  return new HttpApi(sinkSubject, source, gen);
}

export class HttpApi {
  constructor(
    private sinkSubject: Subject<SinkRequest>,
    private source: Producer<ResponseStream>,
    private gen: IdGenerator
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
          id
        })
      ),
      filter(res$ => res$.request.id === id),
      flatten
    );
  }
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
