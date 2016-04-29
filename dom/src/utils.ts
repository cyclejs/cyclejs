function isElement(obj: any) {
  return typeof HTMLElement === `object` ?
    obj instanceof HTMLElement || obj instanceof DocumentFragment :
    obj && typeof obj === `object` && obj !== null &&
    (obj.nodeType === 1 || obj.nodeType === 11) &&
    typeof obj.nodeName === `string`;
}

export const SCOPE_PREFIX = `$$CYCLEDOM$$-`;

export function getElement(selectors: Element | string): Element {
  const domElement: Element = <Element> (typeof selectors === `string` ?
    document.querySelector(<string> selectors) :
    selectors);

  if (typeof selectors === `string` && domElement === null) {
    throw new Error(`Cannot render into unknown element \`${selectors}\``);
  } else if (!isElement(domElement)) {
    throw new Error(`Given container is not a DOM element neither a ` +
      `selector string.`);
  }
  return domElement;
}

export function getScope(namespace: String[]): string {
  return namespace
    .filter(c => c.indexOf(SCOPE_PREFIX) > -1)
    .slice(-1) // only need the latest, most specific, isolated boundary
    .join(``);
}

export function getSelectors(namespace: String[]): string {
  return namespace.filter(c => c.indexOf(SCOPE_PREFIX) === -1).join(` `);
}
