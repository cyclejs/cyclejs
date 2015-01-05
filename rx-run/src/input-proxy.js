'use strict';
var Rx = require('rx');

function InputProxy() {
  this.proxiedProps = {};
  this.get = function getFromProxy(streamKey) {
    if (typeof this.proxiedProps[streamKey] === 'undefined') {
      this.proxiedProps[streamKey] = new Rx.Subject();
    }
    return this.proxiedProps[streamKey];
  };
}

module.exports = InputProxy;
