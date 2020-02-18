import {
  Callbag,
  Source,
  pipe,
  flatten,
  filter,
  makeSubject
} from '@cycle/callbags';
import { RequestOptions, METHOD } from 'minireq';
import { IdGenerator } from './run';

import { SinkRequest, ResponseStream, Request } from './types';

export function makeHttpApi(
  source: Source<ResponseStream>,
  gen: IdGenerator
): [HttpApi, Source<SinkRequest>] {
  const sinkSubject = makeSubject<SinkRequest>();

  const api = new HttpApi(sinkSubject, source, gen);

  return [api, sinkSubject];
}

export class HttpApi {
  constructor(
    private sinkSubject: Callbag<SinkRequest>,
    private source: Source<ResponseStream>,
    private gen: IdGenerator
  ) {}

  public get<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts('GET', optsOrUrl));
  }

  public post<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts('POST', optsOrUrl));
  }

  public put<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts('PUT', optsOrUrl));
  }

  public delete<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts('DELETE', optsOrUrl));
  }

  public patch<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts('PATCH', optsOrUrl));
  }

  public request<T>(options: RequestOptions): Source<T> {
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

function mkOpts(method: METHOD, optsOrUrl: string | Request): RequestOptions {
  if (typeof optsOrUrl === 'string') {
    return { method, url: optsOrUrl };
  } else {
    return { ...optsOrUrl, method };
  }
}
