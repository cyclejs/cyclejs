function isValidNode(obj: any): obj is Element {
  const ELEM_TYPE = 1;
  const FRAG_TYPE = 11;
  return typeof HTMLElement === 'object'
    ? obj instanceof HTMLElement || obj instanceof DocumentFragment
    : obj &&
        typeof obj === 'object' &&
        obj !== null &&
        (obj.nodeType === ELEM_TYPE || obj.nodeType === FRAG_TYPE) &&
        typeof obj.nodeName === 'string';
}

export function isClassOrId(str: string): boolean {
  return str.length > 1 && (str[0] === '.' || str[0] === '#');
}

export function isDocFrag(
  el: Element | DocumentFragment,
): el is DocumentFragment {
  return el.nodeType === 11;
}

export const SCOPE_PREFIX = '$$CYCLEDOM$$-';

export function getValidNode(
  selectors: Element | DocumentFragment | string,
): Element | DocumentFragment | null {
  const domElement = typeof selectors === 'string'
    ? document.querySelector(selectors)
    : selectors;

  if (typeof selectors === 'string' && domElement === null) {
    throw new Error(`Cannot render into unknown element \`${selectors}\``);
  } else if (!isValidNode(domElement)) {
    throw new Error(
      'Given container is not a DOM element neither a ' + 'selector string.',
    );
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
  return namespace.filter(c => c.indexOf(SCOPE_PREFIX) === -1).join(' ');
}
