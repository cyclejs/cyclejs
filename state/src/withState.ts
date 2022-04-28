import { defaultErrorHandler, Handler, Main, WithoutChannel } from '@cycle/run';
import {
  pipe,
  merge,
  subscribe,
  never,
  scan,
  drop,
  makeAsyncSubject,
} from '@cycle/callbags';

import { StateApi, dropRepeats } from './api';

export function withState<Channel extends string = 'state'>(
  channel: Channel | 'state' = 'state'
): <M extends Main>(
  main: M,
  errorHandler?: (err: any) => void
) => WithoutChannel<M, any, any, Channel> {
  return ((main: Main, errorHandler: Handler = defaultErrorHandler) =>
    (sources: any) => {
      const subject = makeAsyncSubject();

      const api = new StateApi(subject, errorHandler);

      const sinks = main({ ...sources, [channel]: api });

      if (sinks[channel]) {
        pipe(
          merge(sinks[channel], never()),
          scan((state, reducer: any) => reducer(state), undefined),
          drop(1),
          dropRepeats(),
          subscribe(
            x => subject(1, x),
            e => subject(2, e)
          )
        );
      }

      return sinks;
    }) as any;
}
