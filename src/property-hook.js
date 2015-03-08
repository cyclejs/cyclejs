'use strict';

class PropertyHook {
  constructor(fn) {
    this.fn = fn;
  }

  hook() {
    this.fn.apply(this, arguments);
  }
}

module.exports = PropertyHook;
