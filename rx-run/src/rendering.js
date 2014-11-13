'use strict';

var h = require('virtual-hyperscript');
var VDOM = {
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
var DOMDelegator = require('dom-delegator');

function isElement(o) {
  return (
    typeof HTMLElement === 'object' ?
      o instanceof HTMLElement : //DOM2
      o && typeof o === 'object' && o !== null && o.nodeType === 1 &&
      typeof o.nodeName === 'string'
  );
}

function renderEvery(vtree$, container) {
  // Find and prepare the container
  var domContainer = (typeof container === 'string') ?
    document.querySelector(container) :
    container;
  if (typeof container === 'string' && domContainer === null) {
    throw new Error('Couldn\'t render into unknown \'' + domContainer + '\'');
  } else if (!isElement(domContainer)) {
    throw new Error('Given container is not a DOM element neither a selector string.');
  }
  domContainer.innerHTML = '';
  // Make the DOM node bound to the VDOM node
  var rootNode = document.createElement('div');
  domContainer.appendChild(rootNode);
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
  isElement: isElement,
  delegator: delegator
};
