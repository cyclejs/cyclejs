import xs, {Stream, MemoryStream, Listener} from 'xstream';
import {Location, History, UnregisterCallback} from 'history';
import {HistoryInput} from './types';

export function createHistory$(
  history: History,
  sink$: Stream<HistoryInput | string>,
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
  return function call(input: HistoryInput): void {
    if (input.type === 'push') {
      history.push(input.pathname, input.state);
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
  call: (input: HistoryInput) => void,
  unlisten: UnregisterCallback,
): Listener<HistoryInput | string> {
  return {
    next(input: HistoryInput | string) {
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
