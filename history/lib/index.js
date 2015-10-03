/* global require */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _require = require("@cycle/core");

var Rx = _require.Rx;

var _require2 = require("history");

var createHistory = _require2.createHistory;
var createHashHistory = _require2.createHashHistory;
var useQueries = _require2.useQueries;
var useBasename = _require2.useBasename;

var _require3 = require("./helpers");

var filterLinks = _require3.filterLinks;
var supportsHistory = _require3.supportsHistory;

function makeHistory(hash, queries, options) {
  var useHash = hash || !supportsHistory();
  if (useHash && queries) {
    return useQueries(useBasename(createHashHistory))(options);
  }
  if (useHash && !queries) {
    return useBasename(createHashHistory)(options);
  }
  if (!useHash && queries) {
    return useQueries(useBasename(createHistory))(options);
  }
  if (!useHash && !queries) {
    return useBasename(createHistory)(options);
  }
}

function createPushState(history, basename) {
  return function pushState(url) {
    if ("string" === typeof url) {
      history.pushState({}, url.replace(basename, ""));
    } else if ("object" === typeof url) {
      var state = url.state;
      var path = url.path;
      var query = url.query;

      history.pushState(state, path.replace(basename, ""), query);
    } else {
      throw new Error("History Driver input must be a string or\n        object but received " + typeof url);
    }
  };
}

function createHistorySubject(history) {
  var subject = new Rx.BehaviorSubject();

  // Append methods for convenience.
  // To be removed if unneeded.
  Object.keys(history).forEach(function (key) {
    if (key !== "listen") {
      subject[key] = history[key];
    }
  });

  return subject;
}

function makeHistoryDriver(config) {
  var _ref = config || {};

  var _ref$hash = _ref.hash;
  var hash = _ref$hash === undefined ? false : _ref$hash;
  var _ref$queries = _ref.queries;
  var queries = _ref$queries === undefined ? true : _ref$queries;

  var options = _objectWithoutProperties(_ref, ["hash", "queries"]);

  var history = makeHistory(hash, queries, options);
  var historySubject = createHistorySubject(history);

  return function historyDriver(url$) {
    url$.distinctUntilChanged().subscribe(createPushState(history, options.basename || ""));

    history.listen(function (location) {
      return historySubject.onNext(location);
    });
    // Convenience
    historySubject.location = historySubject.value;

    return historySubject;
  };
}

function makeServerHistoryDriver(startingLocation) {
  var _ref2 = startingLocation || {};

  var _ref2$pathname = _ref2.pathname;
  var pathname = _ref2$pathname === undefined ? "/" : _ref2$pathname;
  var _ref2$query = _ref2.query;
  var query = _ref2$query === undefined ? {} : _ref2$query;
  var _ref2$search = _ref2.search;
  var search = _ref2$search === undefined ? "" : _ref2$search;
  var _ref2$state = _ref2.state;
  var state = _ref2$state === undefined ? {} : _ref2$state;
  var _ref2$action = _ref2.action;
  var action = _ref2$action === undefined ? "POP" : _ref2$action;
  var _ref2$key = _ref2.key;
  var key = _ref2$key === undefined ? "" : _ref2$key;

  return function historyDriver() {
    return new Rx.BehaviorSubject({
      pathname: pathname,
      query: query,
      search: search,
      state: state,
      action: action,
      key: key
    });
  };
}

exports.makeHistoryDriver = makeHistoryDriver;
exports.makeServerHistoryDriver = makeServerHistoryDriver;
exports.filterLinks = filterLinks;