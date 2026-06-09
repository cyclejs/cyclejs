import * as assert from 'assert';
import {createTagFunction, slot} from '../../src/index';

describe('hyperscript helpers', function() {
  it('should expose the slot helper in the public API', function() {
    const vnode = slot({attrs: {name: 'header'}});

    assert.strictEqual(typeof slot, 'function');
    assert.strictEqual(vnode.sel, 'slot');
    assert.deepStrictEqual(vnode.data!.attrs, {name: 'header'});
  });

  it('should expose createTagFunction in the public API', function() {
    const fancyButton = createTagFunction('fancy-button');
    const vnode = fancyButton('.primary', ['Save']);

    assert.strictEqual(typeof createTagFunction, 'function');
    assert.strictEqual(vnode.sel, 'fancy-button.primary');
    assert.strictEqual(vnode.children[0].text, 'Save');
  });
});
