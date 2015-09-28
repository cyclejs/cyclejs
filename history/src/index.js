import {Rx} from '@cycle/core';
import {createHistory, createHashHistory, useQueries, useBasename} from 'history';
import {filterLinks, supportsHistory} from './helpers';

const  makeHistory: Function = (hash: boolean, queries: boolean, options: Object) => {
  hash = hash || !supportsHistory();
  if (hash && queries) return useQueries(useBasename(createHashHistory))(options);
  if (hash && !queries) return useBasename(createHashHistory)(options);
  if (!hash && queries) return useQueries(useBasename(createHistory))(options);
  if (!hash && !queries) return useBasename(createHistory)(options);
}

const createPushState: Function = (history: Object, basename: string) => {

  return function pushState(url: string|Object): void {
    if ('string' === typeof url) history.pushState({}, url.replace(basename, ''));
    // Is an object with state and path;
    else if ('object' === typeof url) {
      let {state, path} = url;
      history.pushState(state, path.replace(basename, ''))
    } else {
      throw new Error(`History Driver input must be a string or object { state: { the: 'state' }, path : '/path' }") but received ${typeof url}`)
    }
  }

}

const createHistorySubject: Function = (history: Object): Rx.Subject => {
  let subject = new Rx.BehaviorSubject();

  // Append methods for convenience.
  // To be removed if unneeded.
  Object.keys(history).forEach(key => {
    if (key !== 'listen') subject[key] = history[key];
  });

  return subject;
}

const makeHistoryDriver: Function = ( { hash = false, queries = true, ...options } ) => {
  // hash:boolean, queries: boolean, options: Object, baseName: string

  const history: Object = makeHistory(hash, queries, options);
  const historySubject: Rx.Subject = createHistorySubject(history);

  return function historyDriver(url$): Rx.Subject {
    url$
      .distinctUntilChanged()
      .subscribe( createPushState(history, options.basename || '') );

    history.listen( location => historySubject.onNext(location) );

    // Convenience
    historySubject.location = historySubject.value;

    return historySubject;
  }
}

const makeServerHistoryDriver: Function = (startingLocation: Object) => {

  return function historyDriver(location$: Rx.Observable): Rx.Subject {
    let subject = new Rx.BehaviorSubject(startingLocation);

    location$.subscribe(pathname => {
      let location = startingLocation;
      location.pathname = pathname;
      subject.onNext(location);
    });

    return subject;
  }
}

export {
  makeHistoryDriver,
  makeServerHistoryDriver,
  filterLinks
};
