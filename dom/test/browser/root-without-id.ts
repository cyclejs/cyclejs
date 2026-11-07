import * as assert from 'assert';
import {h} from 'snabbdom';
import xs from 'xstream';
import {setup} from '@cycle/run';
import {VNodeWrapper} from '../../src/VNodeWrapper';
import {makeDOMDriver, DOMSource} from '../../src/index';

describe('root identity without an ID', () => {
  let cleanup = () => {};
  afterEach(() => {
    cleanup();
    cleanup = () => {};
  });
  for (const tag of ['div', 'main', 'head']) {
    it('uses the same no-ID ' + tag + ' VNode rather than nesting it', () => {
      const root = document.createElement(tag);
      const node = h(tag, [h('title', 'content')]);
      assert.strictEqual(new VNodeWrapper(root).call(node), node);
      assert.deepStrictEqual(node.data!.isolate, []);
    });
  }

  it('matches the same class on a no-ID root', () => {
    const root = document.createElement('main');
    root.className = 'panel';
    const node = h('main.panel', 'content');
    assert.strictEqual(new VNodeWrapper(root).call(node), node);
  });

  it('retains a wrapper for different tags', () => {
    const root = document.createElement('main');
    const node = h('article', 'content');
    assert.strictEqual(new VNodeWrapper(root).call(node).children![0], node);
  });

  it('retains a wrapper for different classes', () => {
    const root = document.createElement('main');
    root.className = 'panel';
    const node = h('main.other', 'content');
    assert.strictEqual(new VNodeWrapper(root).call(node).children![0], node);
  });

  it('still matches an explicit identical ID', () => {
    const root = document.createElement('main');
    root.id = 'app';
    const node = h('main#app', 'content');
    assert.strictEqual(new VNodeWrapper(root).call(node), node);
  });

  it('retains a wrapper when only the container has an ID', () => {
    const root = document.createElement('main');
    root.id = 'app';
    const node = h('main', 'content');
    assert.strictEqual(new VNodeWrapper(root).call(node).children![0], node);
  });

  it('retains a wrapper when only the VNode has an ID', () => {
    const root = document.createElement('main');
    const node = h('main#app', 'content');
    assert.strictEqual(new VNodeWrapper(root).call(node).children![0], node);
  });

  it('keeps the root and clears children for a null VNode', () => {
    const root = document.createElement('main');
    assert.deepStrictEqual(new VNodeWrapper(root).call(null).children, []);
  });

  it('still wraps a DocumentFragment', () => {
    const root = document.createDocumentFragment();
    const node = h('main', 'content');
    assert.strictEqual(new VNodeWrapper(root).call(node).children![0], node);
  });

  it('renders directly into a real no-ID root through the DOM driver', done => {
    const root = document.createElement('main');
    document.body.appendChild(root);
    const program = setup(
      (_sources: {DOM: DOMSource}) => ({
        DOM: xs.of(h('main', [h('p', 'content')])),
      }),
      {
        DOM: makeDOMDriver(root),
      }
    );
    let dispose: (() => void) | undefined;
    cleanup = () => {
      if (dispose) {
        dispose();
      }
      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    };
    program.sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: element =>
          setTimeout(() => {
            try {
              assert.strictEqual(element, root);
              assert.strictEqual(root.querySelector('main'), null);
              assert.strictEqual(
                root.querySelector('p')!.textContent,
                'content'
              );
              done();
            } catch (error) {
              done(error);
            }
          }, 0),
        error: done,
        complete: () => {},
      });
    dispose = program.run();
  });
});
