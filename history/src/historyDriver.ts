import { StreamAdapter } from '@cycle/base';
import { createBrowserHistory, createMemoryHistory, createHashHistory,
    BrowserHistoryOptions, MemoryHistoryOptions, HashHistoryOptions } from 'history';
import { createHistory$ } from './createHistory$';

/**
 * Create a History Driver to be used in the browser.
 */
export function makeHistoryDriver (options?: BrowserHistoryOptions) {
  const history = createBrowserHistory(options);
  return function historyDriver (sink$: any, runStreamAdapter: StreamAdapter): any {
    return createHistory$(history, sink$, runStreamAdapter);
  };
}

/**
 * Create a History Driver to be used in non-browser enviroments
 * such as server-side node.js.
 */
export function makeServerHistoryDriver (options?: MemoryHistoryOptions) {
  const history = createMemoryHistory(options);
  return function serverHistoryDriver (sink$: any, runStreamAdapter: StreamAdapter) {
    return createHistory$(history, sink$, runStreamAdapter);
  };
}

/**
 * Create a History Driver for older browsers using hash routing
 */
export function makeHashHistoryDriver (options?: HashHistoryOptions) {
  const history = createHashHistory(options);
  return function hashHistoryDriver (sink$: any, runStreamAdapter: StreamAdapter) {
    return createHistory$(history, sink$, runStreamAdapter);
  };
}
