import {
  Subject,
  Producer,
  pipe,
  flatten,
  filter,
  uponStart
} from '@cycle/callbags';
import { IdGenerator } from '@cycle/run';
import {
  RequestOptions,
  METHOD,
  ResponseType,
  ResultMapping,
  Response as RawResponse
} from '@minireq/browser';

import { SinkRequest, ResponseStream, Request } from './types';

export function makeHttpApi(
  source: Producer<ResponseStream>,
  sinkSubject: Subject<SinkRequest>,
  gen: IdGenerator
): HttpApi {
  return new HttpApi(sinkSubject, source, gen);
}

type Response<T, Type extends ResponseType> = RawResponse<
  ResultMapping<T>[Type]
>;

export class HttpApi {
  constructor(
    private sinkSubject: Subject<SinkRequest>,
    private source: Producer<ResponseStream>,
    private gen: IdGenerator
  ) {}

  get response$$(): Producer<ResponseStream> {
    return this.source;
  }

  public get<T, Type extends ResponseType = 'text'>(
    optsOrUrl: string | Request<T, Type>
  ): Producer<Response<T, Type>> {
    return this.request(mkOpts('GET', optsOrUrl));
  }

  public post<T, Type extends ResponseType = 'text'>(
    optsOrUrl: string | Request<T, Type>
  ): Producer<Response<T, Type>> {
    return this.request(mkOpts('POST', optsOrUrl));
  }

  public put<T, Type extends ResponseType = 'text'>(
    optsOrUrl: string | Request<T, Type>
  ): Producer<Response<T, Type>> {
    return this.request(mkOpts('PUT', optsOrUrl));
  }

  public delete<T, Type extends ResponseType = 'text'>(
    optsOrUrl: string | Request<T, Type>
  ): Producer<Response<T, Type>> {
    return this.request(mkOpts('DELETE', optsOrUrl));
  }

  public patch<T, Type extends ResponseType = 'text'>(
    optsOrUrl: string | Request<T, Type>
  ): Producer<Response<T, Type>> {
    return this.request(mkOpts('PATCH', optsOrUrl));
  }

  public request<T>(options: RequestOptions): Producer<RawResponse<T>> {
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
  optsOrUrl: string | Request<any, ResponseType>
): RequestOptions {
  if (typeof optsOrUrl === 'string') {
    return { method, url: optsOrUrl };
  } else {
    return { ...optsOrUrl, method };
  }
}
