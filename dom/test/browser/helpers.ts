import * as fc from 'fast-check';
import { h, VNode } from 'snabbdom';
import { Namespace, Scope } from '../../src/index';

export function createRenderTarget(id: string | null = null) {
  const element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

export const selectorArbitrary = fc
  .record({
    id: fc.option(fc.base64String({ minLength: 1 })),
    classes: fc.array(fc.base64String({ minLength: 1 })),
    tag: fc.constantFrom('div', 'p', 'button', 'span'),
  })
  .map(
    ({ tag, id, classes }) =>
      tag +
      (id ? '#' + id : '') +
      (classes.length > 0 ? '.' + classes.join('.') : '')
  );

type Rec = { sel: string; scope: Scope | null; extra: any; children: Rec[] };

export function makeVtreeArbitrary(extraDataArb?: fc.Arbitrary<any>) {
  return fc
    .letrec(tie => ({
      node: fc.record({
        sel: selectorArbitrary,
        extra: extraDataArb ?? fc.constant(undefined),
        scope: fc.option(
          fc.record({
            type: fc.constantFrom('total', 'sibling'),
            value: fc.base64String({ minLength: 1 }),
          }),
          { freq: 2 }
        ),
        children: fc.oneof(
          { depthFactor: 0.5, withCrossShrink: true },
          fc.constant([]),
          fc.array(tie('node'), { minLength: 1 })
        ),
      }),
    }))
    .node.map(arg => toVNode(arg as Rec, []));
}

function toVNode(
  { sel, scope, children, extra }: Rec,
  namespace: Namespace
): VNode {
  let data = scope ? { namespace: namespace.concat(scope) } : null;
  const n = data?.namespace ?? namespace;
  if (extra) {
    data = data ?? ({} as any);
    (data as any).extra = extra;
  }
  return h(
    sel,
    data,
    children.map(x => toVNode(x, n))
  );
}
