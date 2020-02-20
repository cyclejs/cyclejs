import {
  Callbag,
  Producer,
  pipe,
  flatten,
  filter,
  makeSubject
} from '@cycle/callbags';
import {
  RequestOptions,
  METHOD,
  ResponseType,
  ResultMapping,
  Response as RawResponse
} from 'minireq';
import { IdGenerator } from './run';

import { SinkRequest, ResponseStream, Request } from './types';

export function makeHttpApi(
  source: Producer<ResponseStream>,
  gen: IdGenerator
): [HttpApi, Producer<SinkRequest>] {
  const sinkSubject = makeSubject<SinkRequest>();

  const api = new HttpApi(sinkSubject, source, gen);

  return [api, sinkSubject];
}

type Response<T, Type extends ResponseType> = RawResponse<
  ResultMapping<T>[Type]
>;

export class HttpApi {
  constructor(
    private sinkSubject: Callbag<SinkRequest>,
    private source: Producer<ResponseStream>,
    private gen: IdGenerator
  ) {}

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

    this.sinkSubject(1, {
      ...options,
      id
    });

    return pipe(
      this.source,
      filter(res$ => res$.id === id),
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
