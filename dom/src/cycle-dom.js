let svg = require(`virtual-dom/virtual-hyperscript/svg`)
let {makeDOMDriver} = require(`./render-dom`)
let {makeHTMLDriver} = require(`./render-html`)
let h = require(`./virtual-hyperscript`)

let CycleDOM = {
  /**
   * A factory for the DOM driver function. Takes a `container` to define the
   * target on the existing DOM which this driver will operate on. All custom
   * elements which this driver can detect should be given as the second
   * parameter. The output of this driver is a collection of Observables queried
   * by a getter function: `domDriverOutput.get(selector, eventType)` returns an
   * Observable of events of `eventType` happening on the element determined by
   * `selector`. Also, `domDriverOutput.get(':root')` returns an Observable of
   * DOM element corresponding to the root (or container) of the app on the DOM.
   *
   * @param {(String|HTMLElement)} container the DOM selector for the element
   * (or the element itself) to contain the rendering of the VTrees.
   * @param {Object} customElements a collection of custom element definitions.
   * The key of each property should be the tag name of the custom element, and
   * the value should be a function defining the implementation of the custom
   * element. This function follows the same contract as the top-most `main`
   * function: input are driver responses, output are requests to drivers.
   * @return {Function} the DOM driver function. The function expects an
   * Observable of VTree as input, and outputs the response object for this
   * driver, containing functions `get()` and `dispose()` that can be used for
   * debugging and testing.
   * @function makeDOMDriver
   */
  makeDOMDriver,

  /**
   * A factory for the HTML driver function. Takes the registry object of all
   * custom elements as the only parameter. The HTML driver function will use
   * the custom element registry to detect custom element on the VTree and apply
   * their implementations.
   *
   * @param {Object} customElements a collection of custom element definitions.
   * The key of each property should be the tag name of the custom element, and
   * the value should be a function defining the implementation of the custom
   * element. This function follows the same contract as the top-most `main`
   * function: input are driver responses, output are requests to drivers.
   * @return {Function} the HTML driver function. The function expects an
   * Observable of Virtual DOM elements as input, and outputs an Observable of
   * strings as the HTML renderization of the virtual DOM elements.
   * @function makeHTMLDriver
   */
  makeHTMLDriver,

  /**
   * A shortcut to [virtual-hyperscript](
   * https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript).
   * This is a helper for creating VTrees in Views.
   * @name h
   */
  h,

  /**
   * An adapter around virtual-hyperscript `h()` to allow JSX to be used easily
   * with Babel. Place the [Babel configuration comment](
   * http://babeljs.io/docs/advanced/transformers/other/react/) `@jsx hJSX` at
   * the top of the ES6 file, make sure you import `hJSX` with
   * `import {hJSX} from '@cycle/dom'`, and then you can use JSX to create
   * VTrees.
   * @name hJSX
   */
  hJSX: function hJSX(tag, attrs, ...children) {
    return h(tag, attrs, children)
  },

  /**
   * A shortcut to the svg hyperscript function.
   * @name svg
   */
  svg: svg,
}

module.exports = CycleDOM
