import {
  Producer,
  makeSubject,
  pipe,
  subscribe,
  fromPromise,
  Dispose,
  Operator
} from '@cycle/callbags';
import { RequestFn, Response } from 'minireq';
import { Driver } from './run';

import { ResponseStream, SinkRequest } from './types';

// TODO: Import from @cycle/callbags
function withCleanup<T>(cleanup: (d?: any) => void): Operator<T, T> {
  return source => (_, sink) => {
    source(0, (t, d) => {
      if(t === 2) cleanup(d);
      sink(t, d);
    });
  };
}

export class HttpDriver implements Driver<ResponseStream, SinkRequest> {
  private subject = makeSubject<ResponseStream>();

  constructor(private request: RequestFn) {}

  public consumeSink(sink: Producer<SinkRequest>): Dispose {
    const dispose = pipe(
      sink,
      subscribe(opts => {
        const { promise, abort } = this.request(opts);

        const res$: Producer<Response<any>> = pipe(
          fromPromise(promise),
          withCleanup(abort)
        );

        const responseStream = Object.assign(res$, { id: opts.id });
        this.subject(1, responseStream);
      })
    );

    return dispose;
  }

  public provideSource(): Producer<ResponseStream> {
    return this.subject;
  }
}
