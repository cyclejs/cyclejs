import {Rx} from '@cycle/core';
import {createHistory, createHashHistory, useQueries} from 'history';
import {filterLinks, supportsHistory} from './helpers';

const  makeHistory = (hash, useQueries, options) => {
  hash = hash || supportsHistory();
  if (hash && useQueries) return useQueries(createHashHistory)(options);
  if (hash && !useQueries) return createHashHistory(options);
  if (!hash && useQueries) return useQueries(createHistory)(options);
  if (!hash && !useQueries) return createHistory(options);
}

const createPushState = history => {

  return  pushState = path => {
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

const  makeHistoryDriver = ( { hash = false, useQueries = true, ...options } ) => {

  const history = makeHistory(hash, useQueries, options);
  const historySubject = createHistorySubject(history);

  return  historyDriver = url$ => {

    url$
      .subscribe(createPushState(history));

    history.listen(location => historySubject.onNext(location));

    return historySubject;

  }
}

export {
  makeHistoryDriver,
  filterLinks
};
