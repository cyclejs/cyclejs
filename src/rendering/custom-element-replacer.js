'use strict';
function replaceCustomElementsWithSomething(
  vtree,
  customElementsRegistry,
  customElementVTreeToSomething) {
  // Silently ignore corner cases
  if (!vtree || vtree.type === 'VirtualText') {
    return vtree;
  }
  let tagName = (vtree.tagName || '').toUpperCase();
  // Replace vtree itself
  if (tagName && customElementsRegistry.registry[tagName]) {
    let WidgetClass = customElementsRegistry.registry[tagName];
    return customElementVTreeToSomething(vtree, WidgetClass);
  }
  // Or replace children recursively
  if (Array.isArray(vtree.children)) {
    for (let i = vtree.children.length - 1; i >= 0; i--) {
      vtree.children[i] = replaceCustomElementsWithSomething(
        vtree.children[i],
        customElementsRegistry,
        customElementVTreeToSomething
      );
    }
  }
  return vtree;
}

module.exports = {
  replaceCustomElementsWithSomething,
};
