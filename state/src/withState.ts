import type { MasterWrapper } from '@cycle/run';
import {
  pipe,
  merge,
  subscribe,
  never,
  scan,
  skip,
  makeAsyncSubject,
} from '@cycle/callbags';

import { StateApi, dropRepeats } from './api';

export function withState(channel = 'state'): MasterWrapper {
  return (main, errorHandler) => sources => {
    const subject = makeAsyncSubject();

    const api = new StateApi(subject, errorHandler);

    const sinks = main({ ...sources, [channel]: api });

    if (sinks[channel]) {
      pipe(
        merge(sinks[channel], never()),
        scan((state, reducer: any) => reducer(state), undefined),
        skip(1),
        dropRepeats(),
        subscribe(
          x => subject(1, x),
          e => subject(2, e)
        )
      );
    }
  };
}
