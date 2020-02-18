import {
  Source,
  Callbag,
  makeSubject,
  pipe,
  filter,
  flatten,
  subscribe,
  fromPromise
} from "@cycle/callbags";
import {
  RequestOptions,
  METHOD,
  Result,
  makeRequest,
  RequestFn
} from "minireq";

import { IdGenerator, Driver, Subscription } from "./run";

export type Request = Omit<RequestOptions, "method">;
export type ResponseStream = Source<Result<any>> & { id: number };

export type SinkRequest = RequestOptions & {
  id: number;
};

function makeHttpApi(
  source: Source<ResponseStream>,
  gen: IdGenerator
): [HttpApi, Source<SinkRequest>] {
  const sinkSubject = makeSubject<SinkRequest>();

  const api = new HttpApi(sinkSubject, source, gen);

  return [api, sinkSubject];
}

function mkOpts(method: METHOD, optsOrUrl: string | Request): RequestOptions {
  if (typeof optsOrUrl === "string") {
    return { method, url: optsOrUrl };
  } else {
    return { ...optsOrUrl, method };
  }
}

class HttpApi {
  constructor(
    private sinkSubject: Callbag<SinkRequest>,
    private source: Source<ResponseStream>,
    private gen: IdGenerator
  ) {}

  public get<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts("GET", optsOrUrl));
  }

  public post<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts("POST", optsOrUrl));
  }

  public put<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts("PUT", optsOrUrl));
  }

  public delete<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts("DELETE", optsOrUrl));
  }

  public patch<T>(optsOrUrl: string | Request): Source<T> {
    return this.request(mkOpts("PATCH", optsOrUrl));
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

class HttpDriver implements Driver<ResponseStream, SinkRequest> {
  private subject = makeSubject<ResponseStream>();

  constructor(private request: RequestFn) {}

  public consumeSink(sink: Source<SinkRequest>): Subscription {
    /* const subscription = */ pipe(
      sink,
      subscribe({
        next: opts => {
          // TODO: Cleanup and aborting of requests
          const { promise } = this.request(opts);
          const res$: any = fromPromise(promise);
          res$.id = opts.id;

          this.subject(1, res$);

          // return subscription;
        }
      })
    );
  }

  public produceSource(): Source<ResponseStream> {
    return this.subject;
  }
}

export function makeHttpPlugin(request: RequestFn = makeRequest()) {
  return [new HttpDriver(request), makeHttpApi];
}
