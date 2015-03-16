'use strict';
var Rx = require('rx');

class InputProxy {
  constructor() {
    this.type = 'InputProxy';
    this.proxiedProps = {};
  }

  // For any DataFlowNode
  get(streamKey) {
    if (typeof this.proxiedProps[streamKey] === 'undefined') {
      this.proxiedProps[streamKey] = new Rx.Subject();
    }
    return this.proxiedProps[streamKey];
  }

  // For the DOMUser
  event$(selector, eventName) {
    if (typeof this.proxiedProps[selector] === 'undefined') {
      this.proxiedProps[selector] = {
        _hasEvent$: true
      };
    }
    if (typeof this.proxiedProps[selector][eventName] === 'undefined') {
      this.proxiedProps[selector][eventName] = new Rx.Subject();
    }
    return this.proxiedProps[selector][eventName];
  }
}

module.exports = InputProxy;
