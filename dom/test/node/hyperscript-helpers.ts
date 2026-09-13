import * as assert from 'assert';
import {slot, createTagFunction, div} from '../../src/index';

describe('custom element hyperscript helpers', function() {
  it('should expose a `slot` helper', function() {
    assert.strictEqual(typeof slot, 'function');
  });

  it('should create a slot vnode', function() {
    const vnode: any = (slot as any)();
    assert.strictEqual(vnode.sel, 'slot');
  });

  it('should support selectors on slot', function() {
    const vnode: any = (slot as any)('.named', ['fallback']);
    assert.strictEqual(vnode.sel, 'slot.named');
    assert.strictEqual(vnode.children.length, 1);
  });

  it('should expose createTagFunction', function() {
    assert.strictEqual(typeof createTagFunction, 'function');
  });

  it('should build custom element vnodes', function() {
    const fancyButton: any = createTagFunction('fancy-button');
    const vnode: any = fancyButton('Hello');
    assert.strictEqual(vnode.sel, 'fancy-button');
    assert.strictEqual(vnode.text, 'Hello');
  });

  it('should build custom element vnodes with data', function() {
    const fancyButton: any = createTagFunction('fancy-button');
    const vnode: any = fancyButton({attrs: {id: 'x'}}, ['Hello']);
    assert.strictEqual(vnode.sel, 'fancy-button');
    assert.deepStrictEqual(vnode.data.attrs, {id: 'x'});
  });

  it('should keep existing helpers working', function() {
    const vnode: any = (div as any)('.app', ['hi']);
    assert.strictEqual(vnode.sel, 'div.app');
  });
});
