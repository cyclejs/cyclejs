'use strict';
var VirtualDOM = require('virtual-dom');
var Rx = require('rx');
var DataFlowNode = require('./data-flow-node');
var DataFlowSource = require('./data-flow-source');
var DataFlowSink = require('./data-flow-sink');
var Renderer = require('./renderer');
var PropertyHook = require('./property-hook');

var Cycle = {
  /**
   * Creates a DataFlowNode based on the given `definitionFn`. The `definitionFn`
   * function will be executed immediately on create, and the resulting DataFlowNode
   * outputs will be synchronously available. The inputs are asynchronously injected
   * later with the `inject()` function on the DataFlowNode.
   *
   * @param {Function} definitionFn a function expecting DataFlowNodes as parameters.
   * This function should return an object containing RxJS Observables as properties.
   * The input parameters can also be plain objects with Observables as properties.
   * @return {DataFlowNode} a DataFlowNode, containing a `inject(inputs...)` function.
   */
  createDataFlowNode: function createDataFlowNode(definitionFn) {
    return new DataFlowNode(definitionFn);
  },

  /**
   * Creates a DataFlowSource. It receives an object as argument, and outputs that same
   * object, annotated as a DataFlowSource. For all practical purposes, a DataFlowSource
   * is just a regular object with RxJS Observables, but for consistency with other
   * components in the framework such as DataFlowNode, the returned object is an instance
   * of DataFlowSource.
   *
   * @param {Object} outputObject an object containing RxJS Observables.
   * @return {DataFlowSource} a DataFlowSource equivalent to the given outputObject
   */
  createDataFlowSource: function createDataFlowSource(outputObject) {
    return new DataFlowSource(outputObject);
  },

  /**
   * Creates a DataFlowSink, given a definition function that receives injected inputs.
   *
   * @param {Function} definitionFn a function expecting some DataFlowNode(s) as
   * arguments. The function should subscribe to Observables of the input DataFlowNodes
   * and should return a `Rx.Disposable` subscription.
   * @return {DataFlowSink} a DataFlowSink, containing a `inject(inputs...)` function.
   */
  createDataFlowSink: function createDataFlowSink(definitionFn) {
    return new DataFlowSink(definitionFn);
  },

  /**
   * Returns a DataFlowNode representing a Model, having some Intent as input.
   *
   * Is a specialized case of `createDataFlowNode()`, with the same API.
   *
   * @param {Function} definitionFn a function expecting an Intent DataFlowNode as
   * parameter. Should return an object containing RxJS Observables as properties.
   * @return {DataFlowNode} a DataFlowNode representing a Model, containing a
   * `inject(intent)` function.
   * @function createModel
   */
  createModel: require('./create-model'),

  /**
   * Returns a DataFlowNode representing a View, having some Model as input.
   *
   * Is a specialized case of `createDataFlowNode()`.
   *
   * @param {Function} definitionFn a function expecting a Model object as parameter.
   * Should return an object containing RxJS Observables as properties. The object **must
   * contain** property `vtree$`, an Observable emitting instances of VTree
   * (Virtual DOM elements).
   * @return {DataFlowNode} a DataFlowNode representing a View, containing a
   * `inject(model)` function.
   * @function createView
   */
  createView: require('./create-view'),

  /**
   * Returns a DataFlowNode representing an Intent, having some View as input.
   *
   * Is a specialized case of `createDataFlowNode()`.
   *
   * @param {Function} definitionFn a function expecting a View object as parameter.
   * Should return an object containing RxJS Observables as properties.
   * @return {DataFlowNode} a DataFlowNode representing an Intent, containing a
   * `inject(view)` function.
   * @function createIntent
   */
  createIntent: require('./create-intent'),

  /**
   * Returns a Renderer (a DataFlowSink) bound to a DOM container element. Contains an
   * `inject` function that should be called with a View as argument.
   *
   * @param {(String|HTMLElement)} container the DOM selector for the element (or the
   * element itself) to contain the rendering of the VTrees.
   * @return {Renderer} a Renderer object containing an `inject(view)` function.
   * @function createRenderer
   */
  createRenderer: function createRenderer(container) {
    return new Renderer(container);
  },

  /**
   * Returns a hook for manipulating an element from the real DOM. This is a helper for
   * creating VTrees in Views. Useful for calling `focus()` on the DOM element, or doing
   * similar mutations.
   *
   * See https://github.com/Raynos/mercury/blob/master/docs/faq.md for more details.
   *
   * @param {Function} fn a function with two arguments: `element`, `property`.
   * @return {PropertyHook} a hook
   */
  vdomPropHook: function (fn) {
    return new PropertyHook(fn);
  },

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
