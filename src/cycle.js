'use strict';
let VirtualDOM = require('virtual-dom');
let Rx = require('rx');
let CustomElements = require('./custom-elements');
let RenderingDOM = require('./render-dom');
let RenderingHTML = require('./render-html');

var Cycle = {
  /**
   * Takes a `computer` function which outputs an Observable of virtual DOM
   * elements, and renders that into the DOM element indicated by `container`,
   * which can be either a CSS selector or an actual element. At the same time,
   * provides the `interactions` input to the `computer` function, which is a
   * collection of all possible events happening on all elements which were
   * rendered. You must query this collection with
   * `interactions.get(selector, eventName)` in order to get an Observable of
   * interactions of type `eventName` happening on the element identified by
   * `selector`.
   * Example: `interactions.get('.mybutton', 'click').map(ev => ...)`
   *
   * @param {(String|HTMLElement)} container the DOM selector for the element
   * (or the element itself) to contain the rendering of the VTrees.
   * @param {Function} computer a function that takes `interactions` as input
   * and outputs an Observable of virtual DOM elements.
   * @return {Object} an object containing properties `rootElem$`, `interactions`,
   * `dispose()` that can be used for debugging or testing.
   * @function applyToDOM
   */
  applyToDOM: RenderingDOM.applyToDOM,

  /**
   * Converts a given Observable of virtual DOM elements (`vtree$`) into an
   * Observable of corresponding HTML strings (`html$`). The provided `vtree$`
   * must complete (must call onCompleted on its observers) in finite time,
   * otherwise the output `html$` will never emit an HTML string.
   *
   * @param {Rx.Observable} vtree$ Observable of virtual DOM elements.
   * @return {Rx.Observable} an Observable emitting a string as the HTML
   * renderization of the virtual DOM element.
   * @function renderAsHTML
   */
  renderAsHTML: RenderingHTML.renderAsHTML,

  /**
   * Informs Cycle to recognize the given `tagName` as a custom element
   * implemented as the given function whenever `tagName` is used in VTrees
   * rendered in the context of some parent (in `applyToDOM` or in other custom
   * elements).
   * The given `definitionFn` function takes two parameters as input, in this order:
   * `interactions` and `properties`. The former works just like it does in the
   * `computer` function given to `applyToDOM`, and the later contains
   * Observables representing properties of the custom element, given from the
   * parent context. `properties.get('foo')` will return the Observable `foo$`.
   *
   * The `definitionFn` must output an object containing the property `vtree$`
   * as an Observable. If the output object contains other Observables, then
   * they are treated as custom events of the custom element.
   *
   * @param {String} tagName a name for identifying the custom element.
   * @param {Function} definitionFn the implementation for the custom element.
   * This function takes two arguments: `interactions`, and `properties`, and
   * should output an object of Observables.
   * @function registerCustomElement
   */
  registerCustomElement: CustomElements.registerCustomElement,

  /**
   * A shortcut to the root object of [RxJS](https://github.com/Reactive-Extensions/RxJS).
   * @name Rx
   */
  Rx: Rx,

  /**
   * A shortcut to [virtual-hyperscript](
   * https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript).
   * This is a helper for creating VTrees in Views.
   * @name h
   */
  h: VirtualDOM.h
};

module.exports = Cycle;
