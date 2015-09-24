'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _cycleCore = require('@cycle/core');

var _history = require('history');

var _helpers = require('./helpers');

var makeHistory = function makeHistory(hash, useQueries, options) {
  hash = hash || (0, _helpers.supportsHistory)();
  if (hash && useQueries) return useQueries(_history.createHashHistory)(options);
  if (hash && !useQueries) return (0, _history.createHashHistory)(options);
  if (!hash && useQueries) return useQueries(_history.createHistory)(options);
  if (!hash && !useQueries) return (0, _history.createHistory)(options);
};

var createPushState = function createPushState(history) {

  return pushState = function (path) {
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
  // More descriptive
  subject.location = subject.value;

  return subject;
};

var makeHistoryDriver = function makeHistoryDriver(_ref) {
  var _ref$hash = _ref.hash;
  var hash = _ref$hash === undefined ? false : _ref$hash;
  var _ref$useQueries = _ref.useQueries;
  var useQueries = _ref$useQueries === undefined ? true : _ref$useQueries;

  var options = _objectWithoutProperties(_ref, ['hash', 'useQueries']);

  var history = makeHistory(hash, useQueries, options);
  var historySubject = createHistorySubject(history);

  return historyDriver = function (url$) {

    url$.subscribe(createPushState(history));

    history.listen(function (location) {
      return historySubject.onNext(location);
    });

    return historySubject;
  };
};

exports.makeHistoryDriver = makeHistoryDriver;
exports.filterLinks = _helpers.filterLinks;