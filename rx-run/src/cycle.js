'use strict';
var h = require('virtual-hyperscript');
var Rx = require('rx');
var DataFlowNode = require('./data-flow-node');
var DataFlowSource = require('./data-flow-source');
var DataFlowSink = require('./data-flow-sink');
var Renderer = require('./rendering').Renderer;
var PropertyHook = require('./property-hook');

var Cycle = {
  /**
   * Creates a DataFlowNode.
   *
   * `inputInterface1` is an array of strings, defining which  Observables are expected to
   * exist in the first input. It defines the 'type' of the input, since JavaScript has no
   * strong types. The `inputInterface1` is optional if the DataFlowNode does not have any
   * input. In that case, the function `definitionFn` should not have any parameter
   * either. There can be an arbitrary number of input interfaces, but the number of input
   * interfaces must match the number of arguments that `definitionFn` has. The arguments
   * to `definitionFn` are objects that should fulfil the respective interfaces.
   *
   * @param {Array<String>} [inputInterface1] property names that are expected to exist
   * as RxJS Observables in the first input parameter for `definitionFn`.
   * @param {} ...
   * @param {Function} definitionFn a function expecting objects as parameters (as many as
   * there are interfaces), satisfying the type requirement given by `inputInterface1`,
   * `inputInterface2`, etc. Should return an object containing RxJS Observables as
   * properties.
   * @return {DataFlowNode} a DataFlowNode, containing a `inject(inputs...)` function.
   */
  createDataFlowNode: function createDataFlowNode() {
    return DataFlowNode.apply({}, arguments);
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
  createDataFlowSource: function createDataFlowSource() {
    return DataFlowSource.apply({}, arguments);
  },

  /**
   * Creates a DataFlowSink, given a definition function that receives injected inputs.
   *
   * @param {Function} definitionFn a function expecting some DataFlowNode(s) as
   * arguments. The function should subscribe to Observables of the input DataFlowNodes
   * and should return a `Rx.Disposable` subscription.
   * @return {DataFlowSink} a DataFlowSink, containing a `inject(inputs...)` function.
   */
  createDataFlowSink: function createDataFlowSink() {
    return DataFlowSink.apply({}, arguments);
  },

  /**
   * Returns a DataFlowNode representing a Model, having some Intent as input.
   *
   * Is a specialized case of `createDataFlowNode()`, hence can also receive multiple
   * interfaces and multiple inputs in `definitionFn`.
   *
   * @param {Array<String>} [intentInterface] property names that are expected to exist as
   * RxJS Observables in the input Intent.
   * @param {Function} definitionFn a function expecting an Intent object as parameter.
   * Should return an object containing RxJS Observables as properties.
   * @return {DataFlowNode} a DataFlowNode representing a Model, containing a
   * `inject(intent)` function.
   * @function createModel
   */
  createModel: require('./create-model'),

  /**
   * Returns a DataFlowNode representing a View, having some Model as input.
   *
   * Is a specialized case of `createDataFlowNode()`, hence can also receive multiple
   * interfaces and multiple inputs in `definitionFn`.
   *
   * @param {Array<String>} [modelInterface] property names that are expected to exist as
   * RxJS Observables in the input Model.
   * @param {Function} definitionFn a function expecting a Model object as parameter.
   * Should return an object containing RxJS Observables as properties. The object **must
   * contain** two properties: `vtree$` and `events`. The value of `events` must be an
   * array of strings with the names of the Observables that carry DOM events. `vtree$`
   * should be an Observable emitting instances of VTree (Virtual DOM elements).
   * @return {DataFlowNode} a DataFlowNode representing a View, containing a
   * `inject(model)` function.
   * @function createView
   */
  createView: require('./create-view'),

  /**
   * Returns a DataFlowNode representing an Intent, having some View as input.
   *
   * Is a specialized case of `createDataFlowNode()`, hence can also receive multiple
   * interfaces and multiple inputs in `definitionFn`.
   *
   * @param {Array<String>} [viewInterface] property names that are expected to exist as
   * RxJS Observables in the input View.
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
   * Ties together the given input DataFlowNodes, making them be circular dependencies
   * to each other. Calls `inject()` on each of the given DataFlowNodes, in reverse order.
   * This function can be called with an arbitrary number of inputs, but it is commonly
   * used for the Model-View-Intent triple of nodes.
   *
   * @param {DataFlowNode} model a Model node.
   * @param {DataFlowNode} view a View node.
   * @param {DataFlowNode} intent an Intent node.
   * @function circularInject
   */
  circularInject: function circularInject() {
    for (var i = arguments.length - 1; i >= 0; i--) {
      var current = arguments[i];
      var previous = arguments[(i - 1 >= 0) ? i - 1 : arguments.length - 1];
      if (typeof current === 'undefined' || typeof current.inject !== 'function') {
        throw new Error('Bad input. circularInject() expected a DataFlowNode as input');
      }
      if (current) {
        current.inject(previous);
      }
    }
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
   * A shortcut to [virtual-hyperscript](https://github.com/Raynos/virtual-hyperscript).
   * This is a helper for creating VTrees in Views.
   * @name h
   */
  h: h
};

module.exports = Cycle;
