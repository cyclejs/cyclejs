import {Stream, MemoryStream} from 'xstream';
import {
  createBrowserHistory,
  createMemoryHistory,
  createHashHistory,
  BrowserHistoryOptions,
  MemoryHistoryOptions,
  HashHistoryOptions,
  Location,
  History,
  MemoryHistory,
} from 'history';
import {createHistory$} from './createHistory$';
import {
  HistoryInput,
  HistoryDriver,
  GoBackHistoryInput,
  GoForwardHistoryInput,
  GoHistoryInput,
  PushHistoryInput,
  ReplaceHistoryInput,
} from './types';

function isHistory(x: BrowserHistoryOptions | History): x is History {
  return !!(x as any).createHref;
}

export function makeHistoryDriver(
  options?: BrowserHistoryOptions | History | MemoryHistory
): HistoryDriver {
  let history: any;
  if (options && isHistory(options)) {
    history = options;
  } else {
    history = createBrowserHistory(options);
  }

  return function historyDriver(sink$: Stream<HistoryInput | string>) {
    return createHistory$(history, sink$);
  };
}

export function makeServerHistoryDriver(
  options?: MemoryHistoryOptions
): HistoryDriver {
  const history = createMemoryHistory(options);
  return function serverHistoryDriver(sink$: Stream<HistoryInput | string>) {
    return createHistory$(history, sink$);
  };
}

export function makeHashHistoryDriver(
  options?: HashHistoryOptions
): HistoryDriver {
  const history = createHashHistory(options);
  return function hashHistoryDriver(sink$: Stream<HistoryInput | string>) {
    return createHistory$(history, sink$);
  };
}
