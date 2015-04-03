'use strict';
var Rx = require('rx');

class InputProxy extends Rx.Subject {
  constructor() {
    super();
    this.type = 'InputProxy';
    this._userEvent$ = {};
  }

  // For the rendered rootElem$ with getInteractions$
  choose(selector, eventName) {
    if (typeof this._userEvent$[selector] === 'undefined') {
      this._userEvent$[selector] = {};
    }
    if (typeof this._userEvent$[selector][eventName] === 'undefined') {
      this._userEvent$[selector][eventName] = new Rx.Subject();
    }
    return this._userEvent$[selector][eventName];
  }
}

module.exports = InputProxy;
