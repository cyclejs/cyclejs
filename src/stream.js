'use strict';
let Rx = require('rx');

class InjectableSubject extends Rx.ReplaySubject {
  constructor(definitionFn) {
    super(1);
    this.definitionFn = definitionFn;
  }
  inject() {
    this.onNext(this.definitionFn.apply(null, arguments));

    if (arguments.length === 1) {
      return arguments[0];
    }
    if (arguments.length > 1) {
      return Array.prototype.slice.call(arguments);
    }
  }
}

function createStream(definitionFn) {
  if (arguments.length !== 1 || typeof definitionFn !== 'function') {
    throw new Error('Stream expects the definitionFn as the only argument.');
  }
  if (this instanceof createStream) { // jshint ignore:line
    throw new Error('Cannot use `new` on `createStream()`, it is not a constructor.');
  }

  var subject = new InjectableSubject(definitionFn);
  var observable = subject.flatMap(function flattenStream(obj) {
    // isObservable
    if (obj && typeof obj.subscribe === 'function') {
      return obj;
    }
    return [obj];
  });

  observable.inject = function inject() {
    return subject.inject.apply(subject, arguments);
  };
  observable.dispose = function dispose() {
    return subject.dispose.call(subject);
  };
  // TODO: Add all other instance methods from observer and subject

  return observable;
}

module.exports = createStream;
