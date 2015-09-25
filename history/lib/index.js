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
  if (hash && queries) return (0, _history.useQueries)(_history.createHashHistory)(options);
  if (hash && !queries) return (0, _history.createHashHistory)(options);
  if (!hash && queries) return (0, _history.useQueries)(_history.createHistory)(options);
  if (!hash && !queries) return (0, _history.createHistory)(options);
};

var createPushState = function createPushState(history) {

  return function pushState(path) {
    if ('string' === typeof url) history.pushState({}, url);
    // Is an object with state and path;
    else if ('object' === typeof url) {
        var _url = url;
        var state = _url.state;
        var _path = _url.path;

        history.pushState(state, _path);
      } else {
        throw new Error("History Driver input must be a string or object { state: { the: 'state' }, path : '/path' }");
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

  var history = makeHistory(hash, queries, options);
  var historySubject = createHistorySubject(history);

  return function historyDriver(url$) {
    url$.distinctUntilChanged().subscribe(createPushState(history));

    history.listen(function (location) {
      return historySubject.onNext(location);
    });

    // Convenience
    historySubject.location = historySubject.value;

    return historySubject;
  };
};

var makeServerHistoryDriver = function makeServerHistoryDriver(startUrl) {

  return function historyDriver(url$) {
    var subject = new _cycleCore.Rx.BehaviorSubject({
      pathname: startUrl,
      search: '',
      state: '',
      action: '',
      key: ''
    });

    url$.subscribe(function (url) {
      return subject.onNext({
        pathname: url,
        search: '',
        state: '',
        action: '',
        key: ''
      });
    });

    return subject;
  };
};

exports.makeHistoryDriver = makeHistoryDriver;
exports.makeServerHistoryDriver = makeServerHistoryDriver;
exports.filterLinks = _helpers.filterLinks;