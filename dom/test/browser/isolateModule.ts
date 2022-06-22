import * as assert from 'assert';
import * as fc from 'fast-check';
import { createRenderTarget, makeVtreeArbitrary } from './helpers';
import { init, toVNode, VNode } from 'snabbdom';
import { defaultModules, div, total, sibling } from '../../src/index';

import { NamespaceTree } from '../../src/namespaceTree';
import { makeIsolateModule } from '../../src/isolateModule';
import { ID } from '@cycle/run';

function makeElement(tree: NamespaceTree): VNode {
  const vnode = {
    ...toVNode(createRenderTarget()),
    data: { namespace: [] },
  };
  tree.setRootElement(vnode.elm as Element);
  return vnode;
}

describe('isolateModule', () => {
  it('should correctly construct and cleanup the namespace tree', function () {
    this.timeout(10_000);
    fc.assert(
      fc.property(makeVtreeArbitrary(), vtree => {
        const tree = new NamespaceTree();
        const patch = init(
          defaultModules.concat(
            makeIsolateModule(
              tree,
              () => {},
              () => false
            )
          )
        );

        const elem = makeElement(tree);
        const vnode1 = patch(elem, {
          ...elem,
          children: [vtree],
        });

        const t = tree as any;

        const checkVNodes = (vnode: VNode) => {
          if (vnode.data?.namespace) {
            const treenode = t.treenodeMap.get(vnode.elm);
            assert.notStrictEqual(treenode, undefined);
            assert.strictEqual(treenode, vnode.data.treeNode);

            const traversedNode = t.tree.traverse(vnode.data.namespace);
            assert.strictEqual(traversedNode, treenode);
          }

          (vnode.children as VNode[]).forEach(checkVNodes);
        };

        checkVNodes((vnode1 as any).children[0]);

        patch(vnode1, elem);

        assert.strictEqual(
          t.treenodeMap.size,
          1,
          `treenodeMap has more than one entry: ${t.treenodeMap.size}`
        );
        for (const e of t.treenodeMap.keys()) {
          assert.strictEqual(e, elem.elm);
        }

        if (t.tree.nodes) {
          for (const m of t.tree.nodes.values()) {
            assert.strictEqual(
              m.size,
              0,
              `rootNode still has children: ${t.tree.nodes.size}`
            );
          }
        }
      })
    );
  });

  it('should correctly notify when elements are updated', () => {
    const tree = new NamespaceTree();
    let notifications: Array<[Set<ID>, Element[]]> = [];

    const patch = init(
      defaultModules.concat(
        makeIsolateModule(
          tree,
          (x, e) => notifications.push([x, e]),
          () => false
        )
      )
    );

    const elem = makeElement(tree);

    const vnode0 = div([
      div({ class: { test: true, '1': true }, namespace: [total('1')] }, [
        div(
          {
            class: { test: true, '1': true },
            namespace: [total('1'), sibling('2')],
          },
          [
            div('#foo.test', {
              namespace: [total('1'), sibling('2'), total('3')],
            }),
          ]
        ),
      ]),
    ]);

    const vnode1 = patch(elem, { ...elem, children: [vnode0] });

    const elems1 = tree.insertElementListener({
      commandType: 'addElementsListener',
      id: BigInt(0),
      namespace: [],
      selector: '.test',
    });

    assert.strictEqual(elems1, undefined);

    const elems2 = tree.insertElementListener({
      commandType: 'addElementsListener',
      id: BigInt(1),
      namespace: [total('1')],
      selector: '.test',
    });

    assert.notStrictEqual(elems2, undefined);
    assert.strictEqual(elems2![1].size, 2);
    for (const e of elems2![1].keys()) {
      assert.deepStrictEqual([...e.classList], ['1', 'test']);
    }

    const elems3 = tree.insertElementListener({
      commandType: 'addElementsListener',
      id: BigInt(2),
      namespace: [total('1'), sibling('2'), total('3')],
      selector: '.test',
    });
    assert.notStrictEqual(elems3, undefined);
    assert.strictEqual(elems3![1].size, 1);
    for (const e of elems3![1].keys()) {
      assert.strictEqual(e.id, 'foo');
    }

    // Should also work if element does not exits yet
    const elems4 = tree.insertElementListener({
      commandType: 'addElementsListener',
      id: BigInt(3),
      namespace: [],
      selector: '.bar',
    });
    assert.strictEqual(elems4, undefined);

    const vnode2 = div([
      div({ class: { test: true, '1': true }, namespace: [total('1')] }, [
        div(
          {
            class: { test: true, '2': true },
            namespace: [total('1'), sibling('2')],
          },
          [
            div('#foo.test', {
              namespace: [total('1'), sibling('2'), total('3')],
            }),
          ]
        ),
      ]),
      div('#new.bar.test'),
    ]);
    const vnode2Copy = JSON.parse(JSON.stringify(vnode2));

    const vnode3 = patch(vnode1, { ...elem, children: [vnode2] });

    assert.strictEqual(notifications.length, 3);

    const divUpdate = notifications[0];
    assert.deepStrictEqual([...divUpdate[0].keys()], [BigInt(1)]);
    assert.deepStrictEqual(divUpdate[1].length, 2);
    assert.deepStrictEqual([...divUpdate[1][0].classList], ['1', 'test']);
    assert.deepStrictEqual([...divUpdate[1][1].classList], ['test', '2']);

    assert.strictEqual(notifications[1][1].length, 1);
    assert.deepStrictEqual([...notifications[1][0].keys()], [BigInt(0)]);
    assert.strictEqual(notifications[1][1].length, 1);
    assert.deepStrictEqual([...notifications[2][0].keys()], [BigInt(3)]);

    const vnode4 = div([
      div({ class: { test: true, '1': true }, namespace: [total('1')] }),
      div('#new.bar'),
    ]);

    notifications = [];
    tree.removeElementListener({
      commandType: 'removeElementsListener',
      id: BigInt(3),
    });
    assert.deepStrictEqual(
      [...tree.elementListenerMap.keys()],
      [BigInt(0), BigInt(1), BigInt(2)]
    );

    const vnode5 = patch(vnode3, { ...elem, children: [vnode4] });
    assert.strictEqual(notifications.length, 2);
    // Assert that removing a component root also cleans up its element listeners
    assert.deepStrictEqual(
      [...tree.elementListenerMap.keys()],
      [BigInt(0), BigInt(1)]
    );
    notifications = [];

    patch(vnode5, { ...elem, children: [vnode2Copy, div('.test.quux')] });

    assert.strictEqual(notifications.length, 2);
    const n0 = notifications[0];
    assert.deepStrictEqual([...n0[0].keys()], [BigInt(1)]);
    assert.deepStrictEqual(
      [...n0[1].map(x => [...x.classList])],
      [
        ['1', 'test'],
        ['2', 'test'],
      ]
    );

    const n1 = notifications[1];
    assert.deepStrictEqual([...n1[0].keys()], [BigInt(0)]);
    assert.deepStrictEqual(
      [...n1[1].map(x => [...x.classList])],
      [
        ['bar', 'test'],
        ['test', 'quux'],
      ]
    );

    const elems = tree.insertElementListener({
      commandType: 'addElementsListener',
      id: BigInt(4),
      namespace: [],
      selector: '.test',
    });
    assert.notStrictEqual(elems, undefined);
    assert.deepStrictEqual(
      [...elems![1].keys()].map(e => [...e.classList]),
      [
        ['bar', 'test'],
        ['test', 'quux'],
      ]
    );
  });
});
