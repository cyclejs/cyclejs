import * as assert from 'assert';
import * as fc from 'fast-check';
import { createRenderTarget, makeVtreeArbitrary } from './helpers';
import { init, toVNode, VNode } from 'snabbdom';
import { defaultModules } from '../../src/index';

import { NamespaceTree } from '../../src/namespaceTree';
import { makeIsolateModule } from '../../src/isolateModule';

describe('isolateModule', () => {
  it('should correctly construct and cleanup the namespace tree', function () {
    this.timeout(10_000);
    fc.assert(
      fc.property(makeVtreeArbitrary(), vtree => {
        const tree = new NamespaceTree();
        const patch = init(defaultModules.concat(makeIsolateModule(tree)));

        const elem = {
          ...toVNode(createRenderTarget()),
          data: { namespace: [] },
        };
        // This is normally done in the driver
        (elem.data as any).treeNode = tree.insertNamespaceRoot(
          elem.elm as Element,
          []
        );

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

        assert.strictEqual(
          t.querySet.size,
          0,
          `querySet is not empty: ${t.querySet.size}`
        );
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
});
