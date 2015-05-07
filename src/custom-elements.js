'use strict';
let CustomElementWidget = require('./custom-element-widget');
let Map = Map || require('es6-map'); // eslint-disable-line no-native-reassign
let CustomElementsRegistry = new Map();

function replaceCustomElementsWithSomething(vtree, toSomethingFn) {
  // Silently ignore corner cases
  if (!vtree || vtree.type === 'VirtualText') {
    return vtree;
  }
  let tagName = (vtree.tagName || '').toUpperCase();
  // Replace vtree itself
  if (tagName && CustomElementsRegistry.has(tagName)) {
    let WidgetClass = CustomElementsRegistry.get(tagName);
    return toSomethingFn(vtree, WidgetClass);
  }
  // Or replace children recursively
  if (Array.isArray(vtree.children)) {
    for (let i = vtree.children.length - 1; i >= 0; i--) {
      vtree.children[i] = replaceCustomElementsWithSomething(
        vtree.children[i],
        toSomethingFn
      );
    }
  }
  return vtree;
}

function registerCustomElement(givenTagName, definitionFn) {
  if (typeof givenTagName !== 'string' || typeof definitionFn !== 'function') {
    throw new Error('registerCustomElement requires parameters `tagName` and ' +
      '`definitionFn`.');
  }
  let tagName = givenTagName.toUpperCase();
  if (CustomElementsRegistry.has(tagName)) {
    throw new Error('Cannot register custom element `' + tagName + '` ' +
      'for the DOMUser because that tagName is already registered.');
  }

  let WidgetClass = CustomElementWidget.makeConstructor();
  WidgetClass.definitionFn = definitionFn;
  WidgetClass.prototype.init = CustomElementWidget.makeInit(
    tagName, definitionFn
  );
  WidgetClass.prototype.update = CustomElementWidget.makeUpdate();
  WidgetClass.prototype.destroy = CustomElementWidget.makeDestroy();
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
