let svg = require(`./virtual-hyperscript-svg`)
let {makeDOMDriver} = require(`./render-dom`)
let {makeHTMLDriver} = require(`./render-html`)
let mockDOMSource = require(`./mock-dom-source`)
let h = require(`./virtual-hyperscript`)
let hh = require(`hyperscript-helpers`)(h)

let CycleDOM = {
  /**
   * A factory for the DOM driver function. Takes a `container` to define the
   * target on the existing DOM which this driver will operate on. The output
   * ("source") of this driver is a collection of Observables queried with:
   * `DOMSource.select(selector).events(eventType)` returns an Observable of
   * events of `eventType` happening on the element determined by `selector`.
   * Just `DOMSource.select(selector).observable` returns an Observable of the
   * DOM element matched by the given selector. Also,
   * `DOMSource.select(':root').observable` returns an Observable of DOM element
   * corresponding to the root (or container) of the app on the DOM. The
   * `events()` function also allows you to specify the `useCapture` parameter
   * of the event listener. That is, the full function signature is
   * `events(eventType, useCapture)` where `useCapture` is by default `false`.
   *
   * @param {(String|HTMLElement)} container the DOM selector for the element
   * (or the element itself) to contain the rendering of the VTrees.
   * @return {Function} the DOM driver function. The function expects an
   * Observable of VTree as input, and outputs the source object for this
   * driver, containing functions `select()` and `dispose()` that can be used
   * for debugging and testing.
   * @param {Object} options an options object containing additional
   * configurations. The options object is optional. These are the parameters
   * that may be specified:
   *   - `onError`: a callback function to handle errors. By default it is
   *   `console.error`.
   * @function makeDOMDriver
   */
  makeDOMDriver,

  /**
   * A factory for the HTML driver function.
   *
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
   * Shortcuts to
   * [hyperscript-helpers](https://github.com/ohanhi/hyperscript-helpers).
   * This is a helper for writing virtual-hyperscript. Create virtual DOM
   * elements with `div('.wrapper', [ h1('Header') ])` instead of
   * `h('div.wrapper', [ h('h1', 'Header') ])`.
   * @name hyperscript-helpers
   */
  ...hh,

  /**
   * An adapter around virtual-hyperscript `h()` to allow JSX to be used easily
   * with Babel. Place the [Babel configuration comment](
   * http://babeljs.io/docs/advanced/transformers/other/react/) `@jsx hJSX` at
   * the top of the ES6 file, make sure you import `hJSX` with
   * `import {hJSX} from '@cycle/dom'`, and then you can use JSX to create
   * VTrees.
   *
   * Note that to pass in custom attributes, e.g. data-*, you must use the
   * attributes key like `<tag attributes={{'data-custom-attr': 'foo'}} />`.
   *
   * @name hJSX
   */
  hJSX(tag, attrs, ...children) {
    return h(tag, attrs, children)
  },

  /**
   * A shortcut to the svg hyperscript function.
   * @name svg
   */
  svg,

  /**
   * A testing utility which aids in creating a queryable collection of
   * Observables. Call mockDOMSource giving it an object specifying selectors,
   * eventTypes and their Observables, and get as output an object following the
   * same format as the DOM Driver's source. Example:
   *
   * ```js
   * const domSource = mockDOMSource({
   *   '.foo': {
   *     'click': Rx.Observable.of({target: {}}),
   *     'mouseover': Rx.Observable.of({target: {}}),
   *   },
   *   '.bar': {
   *     'scroll': Rx.Observable.of({target: {}}),
   *     observable: Rx.Observable.of({tagName: 'div'}),
   *   }
   * });
   *
   * // Usage
   * const click$ = domSource.select('.foo').events('click');
   * const element$ = domSource.select('.bar').observable;
   * ```
   *
   * @param {Object} mockedSelectors an object where keys are selector strings
   * and values are objects. Those nested objects have eventType strings as keys
   * and values are Observables you created.
   * @return {Object} fake DOM source object, containing a function `select()`
   * which can be used just like the DOM Driver's source. Call
   * `select(selector).events(eventType)` on the source object to get the
   * Observable you defined in the input of `mockDOMSource`.
   * @function mockDOMSource
   */
  mockDOMSource,
}

module.exports = CycleDOM
