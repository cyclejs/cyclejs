function isElement(obj: any) {
  return typeof HTMLElement === `object` ?
    obj instanceof HTMLElement || obj instanceof DocumentFragment :
    obj && typeof obj === `object` && obj !== null &&
    (obj.nodeType === 1 || obj.nodeType === 11) &&
    typeof obj.nodeName === `string`;
}

export const SCOPE_PREFIX = `$$CYCLEDOM$$-`;

export function getElement(selectors: Element | string): Element | null {
  const domElement = typeof selectors === 'string' ?
    document.querySelector(selectors) :
    selectors;

  if (typeof selectors === 'string' && domElement === null) {
    throw new Error(`Cannot render into unknown element \`${selectors}\``);
  } else if (!isElement(domElement)) {
    throw new Error(`Given container is not a DOM element neither a ` +
      `selector string.`);
  }
  return domElement;
}

/**
 * The full scope of a namespace is the "absolute path" of scopes from
 * parent to child. This is extracted from the namespace, filter only for
 * scopes in the namespace.
 */
export function getFullScope(namespace: Array<String>): string {
  return namespace
    .filter(c => c.indexOf(SCOPE_PREFIX) > -1)
    .map(c => c.replace(SCOPE_PREFIX, ''))
    .join('-');
}

export function getSelectors(namespace: Array<String>): string {
  return namespace.filter(c => c.indexOf(SCOPE_PREFIX) === -1).join(` `);
}
