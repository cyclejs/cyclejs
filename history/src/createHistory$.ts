import xs, {Stream, MemoryStream, Listener} from 'xstream';
import {Location, History, UnregisterCallback} from 'history';
import {HistoryInput} from './types';

type Narrow<S> = S extends string ? never : S;

export function createHistory$(
  history: History,
  sink$: Stream<HistoryInput>
): MemoryStream<Location> {
  const history$ = xs.createWithMemory<Location>().startWith(history.location);
  const call = makeCallOnHistory(history);
  const unlisten = history.listen((loc: Location) => {
    history$._n(loc);
  });
  const sub = sink$.subscribe(createObserver(call, unlisten));
  (history$ as any).dispose = () => {
    sub.unsubscribe();
    unlisten();
  };
  return history$;
}

function makeCallOnHistory(history: History) {
  return function call(input: Narrow<HistoryInput>): void {
    if (input.type === 'push') {
      history.push({...input});
    }

    if (input.type === 'replace') {
      history.replace(input.pathname, input.state);
    }

    if (input.type === 'go') {
      history.go(input.amount);
    }

    if (input.type === 'goBack') {
      history.goBack();
    }

    if (input.type === 'goForward') {
      history.goForward();
    }
  };
}

function createObserver(
  call: (input: Narrow<HistoryInput>) => void,
  unlisten: UnregisterCallback
): Listener<HistoryInput> {
  return {
    next(input: HistoryInput) {
      if (typeof input === 'string') {
        call({type: 'push', pathname: input});
      } else {
        call(input);
      }
    },
    error: err => {
      unlisten();
    },
    complete: () => {
      setTimeout(unlisten);
    },
  };
}
