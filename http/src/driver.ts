import {
  Producer,
  makeSubject,
  pipe,
  subscribe,
  fromPromise,
  Dispose
} from '@cycle/callbags';
import { RequestFn } from 'minireq';
import { Driver } from './run';

import { ResponseStream, SinkRequest } from './types';

export class HttpDriver implements Driver<ResponseStream, SinkRequest> {
  private subject = makeSubject<ResponseStream>();

  constructor(private request: RequestFn) {}

  public consumeSink(sink: Producer<SinkRequest>): Dispose {
    const dispose = pipe(
      sink,
      subscribe(opts => {
        // TODO: Cleanup and aborting of requests
        const { promise } = this.request(opts);
        const res$: any = fromPromise(promise);
        res$.id = opts.id;

        this.subject(1, res$);
      })
    );

    return dispose;
  }

  public provideSource(): Producer<ResponseStream> {
    return this.subject;
  }
}
