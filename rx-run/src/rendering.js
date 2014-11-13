'use strict';

var h = require('virtual-hyperscript');
var VDOM = {
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
var DOMDelegator = require('dom-delegator');

function renderEvery(vtree$, container) {
  // Find and prepare the container
  var container = typeof container === 'string' ? document.querySelector(container) : container;
  if (container === null) {
    throw new Error('Couldn\'t render into unknown \'' + container + '\'');
  }
  container.innerHTML = '';
  // Make the DOM node bound to the VDOM node
  var rootNode = document.createElement('div');
  container.appendChild(rootNode);
  return vtree$.startWith(h())
    .bufferWithCount(2, 1)
    .subscribe(function (buffer) {
      try {
        var oldVTree = buffer[0];
        var newVTree = buffer[1];
        rootNode = VDOM.patch(rootNode, VDOM.diff(oldVTree, newVTree));
      } catch (err) {
        console.error(err);
      }
    });
}

var delegator = new DOMDelegator();

module.exports = {
  renderEvery: renderEvery,
  delegator: delegator
};
