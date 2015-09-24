import {Rx} from '@cycle/core';
import createHistory from 'history/lib/createHistory';
import createHashHistory from 'history/lib/createHashHistory';
import useQueries from 'history/lib/useQueries';
import {filterLinks, supportsHistory} from './helpers';

const  makeHistory = (hash, queries, options) => {
  hash = hash || supportsHistory();
  if (hash && queries) return useQueries(createHashHistory)(options);
  if (hash && !queries) return createHashHistory(options);
  if (!hash && queries) return useQueries(createHistory)(options);
  if (!hash && !queries) return createHistory(options);
}

const createPushState = history => {

  return function pushState(path) {
    if ('string' === typeof url) history.pushState({}, url);
    // Is an object with state and path;
    else if ('object' === typeof url) {
      let {state, path} = url;
      history.pushState(state, path)
    } else {
      throw new Error("History Driver input must be a string or object { state: { the: 'state' }, path : '/path' }");
    }
  }

}

const createHistorySubject = (history) => {
  let subject = new Rx.BehaviorSubject();

  // Append methods for convenience.
  // To be removed if unneeded.
  Object.keys(history).forEach(key => {
    if (key !== 'listen') subject[key] = history[key];
  })
  // More descriptive
  subject.location = subject.value;

  return subject;
}

const  makeHistoryDriver = ( { hash = false, queries = true, ...options } ) => {

  const history = makeHistory(hash, queries, options);
  const historySubject = createHistorySubject(history);

  return function historyDriver(url$) {
    url$
      .distinctUntilChanged()
      .subscribe( createPushState(history) );

    history.listen( location => historySubject.onNext(location) );

    return historySubject;
  }
}

export {
  makeHistoryDriver,
  filterLinks
};
