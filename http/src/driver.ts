import {
  Producer,
  makeReplaySubject,
  pipe,
  subscribe,
  fromPromise,
  Dispose,
  uponEnd,
  throwError
} from '@cycle/callbags';
import { Driver } from '@cycle/run';
import { RequestFn } from '@minireq/browser';

import { ResponseStream, SinkRequest } from './types';

export class HttpDriver implements Driver<ResponseStream, SinkRequest> {
  private subject = makeReplaySubject<ResponseStream>();

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

          if (typeof request.url === 'string') {
            const { promise, abort } = this.request(request);

            res$ = pipe(fromPromise(promise), uponEnd(abort));
          } else {
            res$ = throwError(
              new Error(
                'Please provide a `url` property in the request options.'
              )
            );
          }

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
