import {Scope} from './isolate';

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
  el: Element | DocumentFragment
): el is DocumentFragment {
  return el.nodeType === 11;
}

export function checkValidContainer(
  container: Element | DocumentFragment | string
): void {
  if (typeof container !== 'string' && !isValidNode(container)) {
    throw new Error(
      'Given container is not a DOM element neither a selector string.'
    );
  }
}

export function getValidNode(
  selectors: Element | DocumentFragment | string
): Element | DocumentFragment | null {
  const domElement =
    typeof selectors === 'string'
      ? document.querySelector(selectors)
      : selectors;

  if (typeof selectors === 'string' && domElement === null) {
    throw new Error(`Cannot render into unknown element \`${selectors}\``);
  }
  return domElement;
}

export function getSelectors(namespace: Array<Scope>): string {
  let res = '';
  for (let i = namespace.length - 1; i >= 0; i--) {
    if (namespace[i].type !== 'selector') {
      break;
    }
    res = namespace[i].scope + ' ' + res;
  }
  return res.trim();
}

export function isEqualNamespace(
  a: Array<Scope> | undefined,
  b: Array<Scope> | undefined
): boolean {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].type !== b[i].type || a[i].scope !== b[i].scope) {
      return false;
    }
  }
  return true;
}

export function makeInsert(
  map: Map<string, Map<Element, any>>
): (type: string, elm: Element, value: any) => void {
  return (type, elm, value) => {
    if (map.has(type)) {
      const innerMap = map.get(type)!;
      innerMap.set(elm, value);
    } else {
      const innerMap = new Map<Element, any>();
      innerMap.set(elm, value);
      map.set(type, innerMap);
    }
  };
}
