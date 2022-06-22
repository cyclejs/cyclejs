import { Namespace } from './types';

export function isInScope(
  elementNamespace: Namespace,
  namespace: Namespace
): boolean {
  if (elementNamespace.length < namespace.length) {
    return false;
  }
  let i = 0;
  for (; i < namespace.length; i++) {
    const s1 = elementNamespace[i];
    const s2 = namespace[i];
    if (s1.type !== s2.type || s1.value !== s2.value) {
      return false;
    }
  }
  for (; i < elementNamespace.length; i++) {
    if (elementNamespace[i].type !== 'sibling') {
      return false;
    }
  }

  return true;
}
