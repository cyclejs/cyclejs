import {
  Source,
  makeSubject,
  pipe,
  subscribe,
  fromPromise
} from '@cycle/callbags';
import { RequestFn } from 'minireq';
import { Driver, Subscription } from './run';

import { ResponseStream, SinkRequest } from './types';

export class HttpDriver implements Driver<ResponseStream, SinkRequest> {
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
