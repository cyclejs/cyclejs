import {
  Source,
  makeSubject,
  pipe,
  filter,
  flatten,
  subscribe,
  fromPromise,
  START,
  DATA,
  END,
  ALL
} from "@cycle/callbags";
import {
  RequestOptions,
  METHOD,
  ResponseType,
  Result,
  makeRequest
} from "minireq";

type Subscription = void;

export type Talkback = (type: ALL, payload?: any) => void;
export type Callbag<T> = {
  (t: START, d: Talkback): void;
  (t: DATA, d: T): void;
  (t: END, d?: any): void;
  (t: ALL, d?: any): void;
};

export type Request = RequestOpts & {
  id: number;
};
export type RequestOpts = RequestOptions<METHOD, ResponseType>;

export type ResponseStream = Source<Result<any>> & { id: number };

interface Driver {
  consumeSink(sink: Source<Request>): Subscription;
  produceSource(): Source<ResponseStream>;
}

type IdGenerator = () => number;

function makeHttpApi(
  source: Source<ResponseStream>,
  gen: IdGenerator
): [HttpApi, Source<Request>] {
  const sinkSubject = makeSubject<Result<any>>();

  const api = new HttpApi(sinkSubject, source, gen);

  return [api, sinkSubject];
}

function mkOpts(
  method: METHOD,
  optsOrUrl: string | Omit<RequestOpts, "method">
): RequestOpts {
  if (typeof optsOrUrl === "string") {
    return { method, url: optsOrUrl };
  } else {
    return { ...optsOrUrl, method };
  }
}

class HttpApi {
  constructor(
    private sinkSubject: Callbag<Request>,
    private source: Source<ResponseStream>,
    private gen: IdGenerator
  ) {}

  public get<T>(optsOrUrl: string | Omit<RequestOpts, "method">): Source<T> {
    return this.request(mkOpts("GET", optsOrUrl));
  }

  public post<T>(optsOrUrl: string | Omit<RequestOpts, "method">): Source<T> {
    return this.request(mkOpts("POST", optsOrUrl));
  }

  public put<T>(optsOrUrl: string | Omit<RequestOpts, "method">): Source<T> {
    return this.request(mkOpts("PUT", optsOrUrl));
  }

  public delete<T>(optsOrUrl: string | Omit<RequestOpts, "method">): Source<T> {
    return this.request(mkOpts("DELETE", optsOrUrl));
  }

  public patch<T>(optsOrUrl: string | Omit<RequestOpts, "method">): Source<T> {
    return this.request(mkOpts("PATCH", optsOrUrl));
  }

  public request<T>(options: RequestOpts): Source<T> {
    const id = this.gen();

    this.sinkSubject(1, {
      ...options,
      id
    });

    return pipe(
      this.source,
      filter(res$ => res$.id === id),
      flatten()
    );
  }
}

class HttpDriver implements Driver {
  private subject = makeSubject<ResponseStream>();

  constructor(private request: (options: RequestOpts) => Result<any>) {}

  public consumeSink(sink: Source<Request>): Subscription {
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

export function makeHttpPlugin(
  request: (options: RequestOpts) => Result<any> = makeRequest()
) {
  return [new HttpDriver(request), makeHttpApi];
}
