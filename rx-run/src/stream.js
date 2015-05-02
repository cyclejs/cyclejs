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

// Yes, that's everything.
function createStream(definitionFn) {
  return new InjectableSubject(definitionFn);
}

module.exports = createStream;
