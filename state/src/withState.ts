import type { MasterWrapper } from '@cycle/run';
import {
  makeReplaySubject,
  pipe,
  merge,
  subscribe,
  never,
  scan,
  skip,
} from '@cycle/callbags';

import { StateApi, dropRepeats } from './api';

export function withState(
  initialState: any = undefined,
  channel = 'state'
): MasterWrapper {
  return main => sources => {
    const subject = makeReplaySubject();

    const api = new StateApi(subject);

    const sinks = main({ ...sources, [channel]: api });

    if (sinks[channel]) {
      pipe(
        merge(sinks[channel], never()),
        scan((state, reducer: any) => reducer(state), initialState),
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
