'use strict';
let CustomElementWidget = require('./custom-element-widget');
let Map = require('es6-map'); /* jshint: -W079 */
let CustomElementsRegistry = new Map();

function replaceCustomElementsWithSomething(vtree, customElementVTreeToSomething) {
  // Silently ignore corner cases
  if (!vtree || vtree.type === 'VirtualText') {
    return vtree;
  }
  let tagName = (vtree.tagName || '').toUpperCase();
  // Replace vtree itself
  if (tagName && CustomElementsRegistry.has(tagName)) {
    let WidgetClass = CustomElementsRegistry.get(tagName);
    return customElementVTreeToSomething(vtree, WidgetClass);
  }
  // Or replace children recursively
  if (Array.isArray(vtree.children)) {
    for (let i = vtree.children.length - 1; i >= 0; i--) {
      vtree.children[i] = replaceCustomElementsWithSomething(
        vtree.children[i],
        customElementVTreeToSomething
      );
    }
  }
  return vtree;
}

function registerCustomElement(tagName, definitionFn) {
  if (typeof tagName !== 'string' || typeof definitionFn !== 'function') {
    throw new Error('registerCustomElement requires parameters `tagName` and ' +
      '`definitionFn`.');
  }
  tagName = tagName.toUpperCase();
  if (CustomElementsRegistry.has(tagName)) {
    throw new Error('Cannot register custom element `' + tagName + '` ' +
      'for the DOMUser because that tagName is already registered.');
  }

  let WidgetClass = CustomElementWidget.makeConstructor();
  WidgetClass.definitionFn = definitionFn;
  WidgetClass.prototype.init = CustomElementWidget.makeInit(tagName, definitionFn);
  WidgetClass.prototype.update = CustomElementWidget.makeUpdate();
  CustomElementsRegistry.set(tagName, WidgetClass);
}

function unregisterAllCustomElements() {
  CustomElementsRegistry.clear();
}

module.exports = {
  replaceCustomElementsWithSomething,
  registerCustomElement,
  unregisterAllCustomElements
};
