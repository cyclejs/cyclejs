'use strict';

function PropertyHook(fn) {
  this.fn = fn;
}
PropertyHook.prototype.hook = function () {
  this.fn.apply(this, arguments);
};

module.exports = PropertyHook;
