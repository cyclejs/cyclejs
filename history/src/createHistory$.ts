import { StreamAdapter } from '@cycle/base';
import { LocationAndKey, History, Unsubscribe } from 'history';
import { HistoryInput } from './types';

export function createHistory$ (history: History, sink$: any,
                                runStreamAdapter: StreamAdapter): any {
  const push = makePushState(history);

  const { observer, stream } = runStreamAdapter.makeSubject<LocationAndKey>();

  const history$ = runStreamAdapter.remember<LocationAndKey>(stream);

  const unlisten = history.listen((x: any) => {
    observer.next(x);
  });

  (history$ as any).dispose =
    runStreamAdapter.streamSubscribe(sink$, createObserver(push, unlisten));

  return history$;
};

function makePushState (history: History) {
  return function pushState (input: HistoryInput): void {
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

function createObserver (push: (input: HistoryInput) => any,
                         unlisten: Unsubscribe) {
  return {
    next (input: HistoryInput | String) {
      if (typeof input === 'string') {
        push({ type: 'push', pathname: input });
      } else {
        push(input as HistoryInput);
      }
    },
    error: unlisten,
    complete: unlisten,
  };
}
