import {
  Producer,
  makeSubject,
  pipe,
  subscribe,
  fromPromise,
  Dispose,
  Operator,
  uponEnd
} from '@cycle/callbags';
import { Driver } from '@cycle/run';
import { RequestFn, Response } from 'minireq';

import { ResponseStream, SinkRequest } from './types';

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
          uponEnd(abort)
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
