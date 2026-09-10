import * as assert from 'assert';
import {h} from 'snabbdom';
import {VNodeWrapper} from '../../src/VNodeWrapper';

describe('VNodeWrapper', function() {
  it('should reuse a matching id-less root element', function() {
    const root = document.createElement('main');
    const vnode = h('main', [h('div', [h('div', 'nested')])]);

    const result = new VNodeWrapper(root).call(vnode);

    assert.strictEqual(result, vnode);
    assert.deepStrictEqual(result.data!.isolate, []);
  });

  it('should reuse an id-less root element with matching classes', function() {
    const root = document.createElement('main');
    root.className = 'app shell';
    const vnode = h('main.app.shell', 'content');

    const result = new VNodeWrapper(root).call(vnode);

    assert.strictEqual(result, vnode);
  });

  it('should wrap an id-less root element when classes differ', function() {
    const root = document.createElement('main');
    root.className = 'app';
    const vnode = h('main.other', 'content');

    const result = new VNodeWrapper(root).call(vnode);

    assert.notStrictEqual(result, vnode);
    assert.strictEqual(result.children![0], vnode);
  });

  it('should preserve the wrapper inside a DocumentFragment', function() {
    const fragment = document.createDocumentFragment();
    const root = fragment.appendChild(document.createElement('main'));
    const vnode = h('main', [h('button', 'click')]);

    const result = new VNodeWrapper(root).call(vnode);

    assert.notStrictEqual(result, vnode);
    assert.strictEqual(result.children![0], vnode);
  });
});
