import {Rx} from '@cycle/core';
import {createHistory, createHashHistory, useQueries} from 'history';
import {filterLinks, supportsHistory} from './helpers';

const  makeHistory = (hash, queries, options) => {
  hash = hash || !supportsHistory();
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
  });

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

    // Convenience
    historySubject.location = historySubject.value;

    return historySubject;
  }
}

const makeServerHistoryDriver = startUrl => {

  return function historyDriver(url$) {
    let subject = new Rx.BehaviorSubject({
      pathname: startUrl,
      search: '',
      state: '',
      action: '',
      key: ''
    });

    url$.subscribe(url => subject.onNext({
      pathname: url,
      search: '',
      state: '',
      action: '',
      key: ''
    }));

    return subject;
  }
}

export {
  makeHistoryDriver,
  makeServerHistoryDriver,
  filterLinks
};
