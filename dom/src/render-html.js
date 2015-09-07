let {Rx} = require(`@cycle/core`)
let toHTML = require(`vdom-to-html`)
let {replaceCustomElementsWithSomething, makeCustomElementsRegistry} =
  require(`./custom-elements`)
let {makeCustomElementInput, ALL_PROPS} = require(`./custom-element-widget`)
let {transposeVTree} = require(`./transposition`)

function makePropertiesDriverFromVTree(vtree) {
  return {
    get: (propertyName) => {
      if (propertyName === ALL_PROPS) {
        return Rx.Observable.just(vtree.properties)
      } else {
        return Rx.Observable.just(vtree.properties[propertyName])
      }
    },
  }
}

function makeReplaceCustomElementsWithVTree$(CERegistry, driverName) {
  return function replaceCustomElementsWithVTree$(vtree) {
    return replaceCustomElementsWithSomething(vtree, CERegistry,
      function toVTree$(_vtree, WidgetClass) {
        let interactions = {get: () => Rx.Observable.empty()}
        let props = makePropertiesDriverFromVTree(_vtree)
        let input = makeCustomElementInput(interactions, props)
        let output = WidgetClass.definitionFn(input)
        let vtree$ = output[driverName].last()
        /*eslint-disable no-use-before-define */
        return convertCustomElementsToVTree(vtree$, CERegistry, driverName)
        /*eslint-enable no-use-before-define */
      })
  }
}

function convertCustomElementsToVTree(vtree$, CERegistry, driverName) {
  return vtree$
    .map(makeReplaceCustomElementsWithVTree$(CERegistry, driverName))
    .flatMap(transposeVTree)
}

function makeResponseGetter() {
  return function get(selector) {
    if (console && console.log) {
      console.log(`WARNING: HTML Driver's get(selector) is deprecated.`)
    }
    if (selector === `:root`) {
      return this
    } else {
      return Rx.Observable.empty()
    }
  }
}

function makeBogusSelect() {
  return function select() {
    return {
      observable: Rx.Observable.empty(),
      events() {
        return Rx.Observable.empty()
      },
    }
  }
}

function makeHTMLDriver(customElementDefinitions = {}) {
  let registry = makeCustomElementsRegistry(customElementDefinitions)
  return function htmlDriver(vtree$, driverName) {
    let vtreeLast$ = vtree$.last()
    let output$ = convertCustomElementsToVTree(vtreeLast$, registry, driverName)
      .map(vtree => toHTML(vtree))
    output$.get = makeResponseGetter()
    output$.select = makeBogusSelect()
    return output$
  }
}

module.exports = {
  makePropertiesDriverFromVTree,
  makeReplaceCustomElementsWithVTree$,
  convertCustomElementsToVTree,

  makeHTMLDriver,
}
