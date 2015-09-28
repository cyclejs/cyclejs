'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _cycleCore = require('@cycle/core');

var _history = require('history');

var _helpers = require('./helpers');

var makeHistory = function makeHistory(hash, queries, options) {
  hash = hash || !(0, _helpers.supportsHistory)();
  if (hash && queries) return (0, _history.useQueries)((0, _history.useBasename)(_history.createHashHistory))(options);
  if (hash && !queries) return (0, _history.useBasename)(_history.createHashHistory)(options);
  if (!hash && queries) return (0, _history.useQueries)((0, _history.useBasename)(_history.createHistory))(options);
  if (!hash && !queries) return (0, _history.useBasename)(_history.createHistory)(options);
};

var createPushState = function createPushState(history, basename) {

  return function pushState(url) {
    if ('string' === typeof url) history.pushState({}, url.replace(basename, ''));
    // Is an object with state and path;
    else if ('object' === typeof url) {
        var state = url.state;
        var path = url.path;

        history.pushState(state, path.replace(basename, ''));
      } else {
        throw new Error('History Driver input must be a string or object { state: { the: \'state\' }, path : \'/path\' }") but received ' + typeof url);
      }
  };
};

var createHistorySubject = function createHistorySubject(history) {
  var subject = new _cycleCore.Rx.BehaviorSubject();

  // Append methods for convenience.
  // To be removed if unneeded.
  Object.keys(history).forEach(function (key) {
    if (key !== 'listen') subject[key] = history[key];
  });

  return subject;
};

var makeHistoryDriver = function makeHistoryDriver(_ref) {
  var _ref$hash = _ref.hash;
  var hash = _ref$hash === undefined ? false : _ref$hash;
  var _ref$queries = _ref.queries;
  var queries = _ref$queries === undefined ? true : _ref$queries;

  var options = _objectWithoutProperties(_ref, ['hash', 'queries']);

  // hash:boolean, queries: boolean, options: Object, baseName: string

  var history = makeHistory(hash, queries, options);
  var historySubject = createHistorySubject(history);

  return function historyDriver(url$) {
    url$.distinctUntilChanged().subscribe(createPushState(history, options.basename || ''));

    history.listen(function (location) {
      return historySubject.onNext(location);
    });

    // Convenience
    historySubject.location = historySubject.value;

    return historySubject;
  };
};

var makeServerHistoryDriver = function makeServerHistoryDriver(startingLocation) {

  return function historyDriver(location$) {
    var subject = new _cycleCore.Rx.BehaviorSubject(startingLocation);

    location$.subscribe(function (pathname) {
      var location = startingLocation;
      location.pathname = pathname;
      subject.onNext(location);
    });

    return subject;
  };
};

exports.makeHistoryDriver = makeHistoryDriver;
exports.makeServerHistoryDriver = makeServerHistoryDriver;
exports.filterLinks = _helpers.filterLinks;