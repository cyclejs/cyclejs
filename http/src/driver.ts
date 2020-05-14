import {
  Producer,
  makeSubject,
  pipe,
  subscribe,
  map,
  fromPromise,
  Dispose,
  uponEnd,
  throwError,
  merge
} from '@cycle/callbags';
import { Driver } from '@cycle/run';
import { RequestFn, Response, Progress as RawProgress } from '@minireq/browser';

import { ResponseStream, SinkRequest } from './types';

export class HttpDriver implements Driver<ResponseStream, SinkRequest> {
  private subject = makeSubject<ResponseStream>();

  constructor(
    private request: RequestFn,
    private errorHandler: (err: any) => void
  ) {}

  public consumeSink(sink: Producer<SinkRequest>): Dispose {
    const dispose = pipe(
      sink,
      subscribe(
        opts => {
          if (typeof opts !== 'string' && typeof opts !== 'object') {
            this.subject(
              2,
              new Error(
                'Observable of requests given to HTTP Driver must emit ' +
                  'either URL strings or objects with parameters.'
              )
            );
            return;
          }

          let res$: any;
          const request: SinkRequest =
            typeof opts === 'string' ? { url: opts, method: 'GET' } : opts;

          if (!request.method) {
            request.method = 'GET';
          }

          if (typeof request.url === 'string') {
            const r = { ...request, progress: undefined };

            const fromRequest = (promise: Promise<Response<any>>) =>
              pipe(
                fromPromise(promise),
                map(res => ({ type: 'response', ...res }))
              );

            if (request.progress) {
              const progressSubject = makeSubject<{
                type: 'progress';
                event: RawProgress;
              }>();
              (r as any).progress = (event: RawProgress) =>
                progressSubject(1, { type: 'progress', event });

              const { promise, abort } = this.request(r);

              res$ = pipe(
                merge(fromRequest(promise), progressSubject),
                uponEnd(abort)
              );
            } else {
              const { promise, abort } = this.request(r);

              res$ = pipe(fromRequest(promise), uponEnd(abort));
            }
          } else {
            res$ = throwError(
              new Error(
                'Please provide a `url` property in the request options.'
              )
            );
          }

          res$ = pipe(
            res$,
            map((res: any) => ({ ...res, request }))
          );

          const responseStream = Object.assign(res$, { request });
          Object.freeze(responseStream);
          this.subject(1, responseStream);
        },
        err => {
          // This is to break out of promise error handling
          setTimeout(() => this.errorHandler(err));
        }
      )
    );

    return dispose;
  }

  public provideSource(): Producer<ResponseStream> {
    return this.subject;
  }
}
