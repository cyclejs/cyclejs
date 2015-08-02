let {makeWidgetClass} = require(`./custom-element-widget`)
let Map = Map || require(`es6-map`) // eslint-disable-line no-native-reassign

function replaceCustomElementsWithSomething(vtree, registry, toSomethingFn) {
  // Silently ignore corner cases
  if (!vtree) {
    return vtree
  }
  let tagName = (vtree.tagName || ``).toUpperCase()
  // Replace vtree itself
  if (tagName && registry.has(tagName)) {
    let WidgetClass = registry.get(tagName)
    return toSomethingFn(vtree, WidgetClass)
  }
  // Or replace children recursively
  if (Array.isArray(vtree.children)) {
    for (let i = vtree.children.length - 1; i >= 0; i--) {
      vtree.children[i] = replaceCustomElementsWithSomething(
        vtree.children[i],
        registry,
        toSomethingFn
      )
    }
  }
  return vtree
}

function makeCustomElementsRegistry(definitions) {
  let registry = new Map()
  for (let tagName in definitions) {
    if (definitions.hasOwnProperty(tagName)) {
      registry.set(
        tagName.toUpperCase(),
        makeWidgetClass(tagName, definitions[tagName])
      )
    }
  }
  return registry
}

module.exports = {
  replaceCustomElementsWithSomething,
  makeCustomElementsRegistry,
}
