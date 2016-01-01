let Rx = require(`rx`)
let fromEvent = require(`./fromevent`)
let VDOM = {
  h: require(`./virtual-hyperscript`),
  diff: require(`virtual-dom/diff`),
  patch: require(`virtual-dom/patch`),
  parse: typeof window !== `undefined` ? require(`vdom-parser`) : () => {},
}
let {transposeVTree} = require(`./transposition`)
let matchesSelector
// Try-catch to prevent unnecessary import of DOM-specifics in Node.js env:
try {
  matchesSelector = require(`matches-selector`)
} catch (err) {
  matchesSelector = () => {}
}

function isElement(obj) {
  return typeof HTMLElement === `object` ?
    obj instanceof HTMLElement || obj instanceof DocumentFragment : //DOM2
    obj && typeof obj === `object` && obj !== null &&
    (obj.nodeType === 1 || obj.nodeType === 11) &&
    typeof obj.nodeName === `string`
}

function wrapTopLevelVTree(vtree, rootElem) {
  const {id: vtreeId = ``} = vtree.properties
  const {className: vtreeClass = ``} = vtree.properties
  const sameId = vtreeId === rootElem.id
  const sameClass = vtreeClass === rootElem.className
  const sameTagName = vtree.tagName.toUpperCase() === rootElem.tagName
  if (sameId && sameClass && sameTagName) {
    return vtree
  }
  let attrs = {}
  if (rootElem.id) { attrs.id = rootElem.id }
  if (rootElem.className) { attrs.className = rootElem.className }
  return VDOM.h(rootElem.tagName, attrs, [vtree])
}

function makeDiffAndPatchToElement$(rootElem) {
  return function diffAndPatchToElement$([oldVTree, newVTree]) {
    if (typeof newVTree === `undefined`) { return Rx.Observable.empty() }

    let prevVTree = wrapTopLevelVTree(oldVTree, rootElem)
    let nextVTree = wrapTopLevelVTree(newVTree, rootElem)
    /* eslint-disable */
    rootElem = VDOM.patch(rootElem, VDOM.diff(prevVTree, nextVTree))
    /* eslint-enable */
    return Rx.Observable.just(rootElem)
  }
}

function renderRawRootElem$(vtree$, domContainer) {
  let diffAndPatchToElement$ = makeDiffAndPatchToElement$(domContainer)
  return vtree$
    .flatMapLatest(transposeVTree)
    .startWith(VDOM.parse(domContainer))
    .pairwise()
    .flatMap(diffAndPatchToElement$)
}

function isolateSource(source, scope) {
  return source.select(`.cycle-scope-${scope}`)
}

function isolateSink(sink, scope) {
  return sink.map(vtree => {
    const {className: vtreeClass = ``} = vtree.properties
    if (vtreeClass.indexOf(`cycle-scope-${scope}`) === -1) {
      const c = `${vtreeClass} cycle-scope-${scope}`.trim()
      vtree.properties.className = c
    }
    if (vtree.properties.attributes) { // for svg root elements
      const vtreeAttrClass = vtree.properties.attributes[`class`] || ``
      if (vtreeAttrClass.indexOf(`cycle-scope-${scope}`) === -1) {
        const cattr = `${vtreeAttrClass} cycle-scope-${scope}`.trim()
        vtree.properties.attributes[`class`] = cattr
      }
    }
    return vtree
  })
}

function makeIsStrictlyInRootScope(namespace) {
  const classIsForeign = c => {
    const matched = c.match(/cycle-scope-(\S+)/)
    return matched && namespace.indexOf(`.${c}`) === -1
  }
  const classIsDomestic = c => {
    const matched = c.match(/cycle-scope-(\S+)/)
    return matched && namespace.indexOf(`.${c}`) !== -1
  }
  return function isStrictlyInRootScope(leaf) {
    for (let el = leaf; el; el = el.parentElement) {
      const split = String.prototype.split
      const classList = el.classList || split.call(el.className, ` `)
      if (Array.prototype.some.call(classList, classIsDomestic)) {
        return true
      }
      if (Array.prototype.some.call(classList, classIsForeign)) {
        return false
      }
    }
    return true
  }
}

function makeEventsSelector(rootEl$, namespace) {
  return function events(eventName, useCapture = false) {
    if (typeof eventName !== `string`) {
      throw new Error(`DOM driver's events() expects argument to be a ` +
        `string representing the event type to listen for.`)
    }
    const isStrictlyInRootScope = makeIsStrictlyInRootScope(namespace)

    return rootEl$
      .first()
      .flatMapLatest(rootEl => {
        if (rootEl.length === 0) {
          return Rx.Observable.empty()
        }
        if (!namespace || namespace.length === 0) {
          return fromEvent(rootEl, eventName, useCapture)
        }
        const descendantSelector = namespace.join(` `)
        if (matchesSelector(rootEl, descendantSelector)) { // is root Element
          return fromEvent(rootEl, eventName, useCapture)
        }
        const topSelector = namespace.join(``)
        const roof = rootEl.parentElement
        return fromEvent(rootEl, eventName, useCapture).filter(ev => {
          for (let el = ev.target; el && el !== roof; el = el.parentElement) {
            if (!isStrictlyInRootScope(el)) {
              break
            }
            if (matchesSelector(el, descendantSelector) ||
                matchesSelector(el, topSelector))
            {
              Object.defineProperty(ev, `currentTarget`, {value: el})
              return true
            }
          }
          return false
        })
      })
      .share()
  }
}

function makeElementSelector(rootEl$) {
  return function select(selector) {
    if (typeof selector !== `string`) {
      throw new Error(`DOM driver's select() expects the argument to be a ` +
        `string as a CSS selector`)
    }

    const namespace = this.namespace
    const trimmedSelector = selector.trim()
    const childNamespace = trimmedSelector === `:root` ?
      namespace :
      namespace.concat(trimmedSelector)
    const element$ = rootEl$.map(rootEl => {
      if (childNamespace.join(``) === ``) {
        return rootEl
      }
      let nodeList = rootEl.querySelectorAll(childNamespace.join(` `))
      if (nodeList.length === 0) {
        nodeList = rootEl.querySelectorAll(childNamespace.join(``))
      }
      const array = Array.prototype.slice.call(nodeList)
      return array.filter(makeIsStrictlyInRootScope(childNamespace))
    })
    return {
      observable: element$,
      namespace: childNamespace,
      select: makeElementSelector(rootEl$),
      events: makeEventsSelector(rootEl$, childNamespace),
      isolateSource,
      isolateSink,
    }
  }
}

function validateDOMSink(vtree$) {
  if (!vtree$ || typeof vtree$.subscribe !== `function`) {
    throw new Error(`The DOM driver function expects as input an ` +
      `Observable of virtual DOM elements`)
  }
}

function defaultOnErrorFn(msg) {
  if (console && console.error) {
    console.error(msg)
  } else {
    console.log(msg)
  }
}

function makeDOMDriver(container, options) {
  // Find and prepare the container
  let domContainer = typeof container === `string` ?
    document.querySelector(container) :
    container
  // Check pre-conditions
  if (typeof container === `string` && domContainer === null) {
    throw new Error(`Cannot render into unknown element \`${container}\``)
  } else if (!isElement(domContainer)) {
    throw new Error(`Given container is not a DOM element neither a selector ` +
      `string.`)
  }
  const {onError = defaultOnErrorFn} = options || {}
  if (typeof onError !== `function`) {
    throw new Error(`You provided an \`onError\` to makeDOMDriver but it was ` +
      `not a function. It should be a callback function to handle errors.`)
  }

  return function domDriver(vtree$) {
    validateDOMSink(vtree$)
    let rootElem$ = renderRawRootElem$(vtree$, domContainer)
      .startWith(domContainer)
      .doOnError(onError)
      .replay(null, 1)
    let disposable = rootElem$.connect()
    return {
      observable: rootElem$,
      namespace: [],
      select: makeElementSelector(rootElem$),
      events: makeEventsSelector(rootElem$, []),
      dispose: () => disposable.dispose(),
      isolateSource,
      isolateSink,
    }
  }
}

module.exports = {
  isElement,
  wrapTopLevelVTree,
  makeDiffAndPatchToElement$,
  renderRawRootElem$,
  validateDOMSink,

  makeDOMDriver,
}
