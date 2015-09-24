'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _cycleCore = require('@cycle/core');

var _historyLibCreateHistory = require('history/lib/createHistory');

var _historyLibCreateHistory2 = _interopRequireDefault(_historyLibCreateHistory);

var _historyLibCreateHashHistory = require('history/lib/createHashHistory');

var _historyLibCreateHashHistory2 = _interopRequireDefault(_historyLibCreateHashHistory);

var _historyLibUseQueries = require('history/lib/useQueries');

var _historyLibUseQueries2 = _interopRequireDefault(_historyLibUseQueries);

var _helpers = require('./helpers');

var makeHistory = function makeHistory(hash, queries, options) {
  hash = hash || (0, _helpers.supportsHistory)();
  if (hash && queries) return (0, _historyLibUseQueries2['default'])(_historyLibCreateHashHistory2['default'])(options);
  if (hash && !queries) return (0, _historyLibCreateHashHistory2['default'])(options);
  if (!hash && queries) return (0, _historyLibUseQueries2['default'])(_historyLibCreateHistory2['default'])(options);
  if (!hash && !queries) return (0, _historyLibCreateHistory2['default'])(options);
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
  // More descriptive
  subject.location = subject.value;

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

    return historySubject;
  };
};

exports.makeHistoryDriver = makeHistoryDriver;
exports.filterLinks = _helpers.filterLinks;