'use strict';
var Rx = require('rx');

class InputProxy extends Rx.Subject {
  constructor() {
    super();
    this.type = 'InputProxy';
    this._interaction$ = {};
  }

  // For the rendered rootElem$ with interaction$
  choose(selector, eventName) {
    if (typeof this._interaction$[selector] === 'undefined') {
      this._interaction$[selector] = {};
    }
    if (typeof this._interaction$[selector][eventName] === 'undefined') {
      this._interaction$[selector][eventName] = new Rx.Subject();
    }
    return this._interaction$[selector][eventName];
  }
}

module.exports = InputProxy;
