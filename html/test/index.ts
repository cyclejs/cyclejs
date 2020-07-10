import * as assert from 'assert';
import * as sinon from 'sinon';
import xs, {Stream} from 'xstream';
import {setup, run} from '@cycle/run';
import {div, h3, h2, h, VNode} from '@cycle/dom';
import {makeHTMLDriver, HTMLSource} from '../src/index';

describe('HTML Driver', function() {
  it('should output HTML when given a simple vtree stream', function(done) {
    function app() {
      return {
        html: xs.of(div('.test-element', ['Foobar'])),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    run(app, {
      html: makeHTMLDriver(effect),
    });
  });

  it('should allow effect to see one or many HTML outputs', function(done) {
    function app() {
      return {
        html: xs
          .periodic(150)
          .take(3)
          .map(i => div('.test-element', ['Foobar' + i])),
      };
    }

    const expected = [
      '<div class="test-element">Foobar0</div>',
      '<div class="test-element">Foobar1</div>',
      '<div class="test-element">Foobar2</div>',
    ];

    function effect(html: string): void {
      assert.strictEqual(html, expected.shift());
      if (expected.length === 0) {
        done();
      }
    }

    run(app, {
      html: makeHTMLDriver(effect),
    });
  });

  it('should allow effect to see one (the last) HTML outputs', function(done) {
    function app() {
      return {
        html: xs
          .periodic(150)
          .take(3)
          .map(i => div('.test-element', ['Foobar' + i]))
          .last(),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html, '<div class="test-element">Foobar2</div>');
      done();
    }

    run(app, {
      html: makeHTMLDriver(effect),
    });
  });

  it('should output HTMLSource as an adapted stream', function(done) {
    type MySources = {
      html: HTMLSource;
    };
    type MySinks = {
      html: Stream<VNode>;
    };

    function app(_sources: MySources): MySinks {
      return {
        html: xs.of(div('.test-element', ['Foobar'])),
      };
    }
    const {sources} = setup(app, {
      html: makeHTMLDriver((html: string) => {}),
    });
    assert.strictEqual(
      typeof (sources.html.elements() as any).imitate,
      'function'
    );
    done();
  });

  it('should have DevTools flag in HTMLSource elements() stream', function(done) {
    function app(_sources: {html: HTMLSource}): any {
      return {
        html: xs.of(div('.test-element', ['Foobar'])),
      };
    }
    const {sources} = setup(app, {
      html: makeHTMLDriver((html: string) => {}),
    });
    assert.strictEqual((sources.html.elements() as any)._isCycleSource, 'html');
    done();
  });

  it('should have DevTools flag in HTMLSource elements() stream', function(done) {
    function app(_sources: {html: HTMLSource}): any {
      return {
        html: xs.of(div('.test-element', ['Foobar'])),
      };
    }
    const {sources} = setup(app, {
      html: makeHTMLDriver((html: string) => {}),
    });
    assert.strictEqual(
      (sources.html.events('click') as any)._isCycleSource,
      'html'
    );
    done();
  });

  it('should make bogus select().events() as sources', function(done) {
    function app(sources: {html: HTMLSource}) {
      assert.strictEqual(typeof sources.html.select, 'function');
      assert.strictEqual(
        typeof sources.html.select('whatever').elements().imitate,
        'function'
      );
      assert.strictEqual(
        typeof sources.html.select('whatever').events('click').imitate,
        'function'
      );
      return {
        html: xs.of(div('.test-element', ['Foobar'])),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    run(app, {
      html: makeHTMLDriver(effect),
    });
  });

  it('should output simple HTML Observable', function(done) {
    function app() {
      return {
        html: xs.of(div('.test-element', ['Foobar'])),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    run(app, {
      html: makeHTMLDriver(effect),
    });
  });

  it('should support passing custom modules', function(done) {
    function main() {
      return {
        html: xs.of(div(['Hello'])),
      };
    }

    function effect(html: string): void {
      try {
        assert.strictEqual(html, '<div custom="stuff">Hello</div>');
      } catch (err) {
        done(err);
        return;
      }
      done();
    }

    const {sinks, sources, run: _run} = setup(main, {
      html: makeHTMLDriver(effect, {
        modules: [
          (vnode: VNode, attributes: Map<string, any>) => {
            attributes.set('custom', 'stuff');
          },
        ],
      }),
    });
    _run();
  });

  it('should render a complex and nested HTML', function(done) {
    function app() {
      return {
        html: xs.of(
          h('.test-element', [
            div([h2('.a', 'a'), h('h4.b', 'b'), h('h1.fooclass')]),
            div([h3('.c', 'c'), h('div', [h('p.d', 'd'), h('h2.barclass')])]),
          ])
        ),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(
        html,
        '<div class="test-element">' +
          '<div>' +
          '<h2 class="a">a</h2>' +
          '<h4 class="b">b</h4>' +
          '<h1 class="fooclass"></h1>' +
          '</div>' +
          '<div>' +
          '<h3 class="c">c</h3>' +
          '<div>' +
          '<p class="d">d</p>' +
          '<h2 class="barclass"></h2>' +
          '</div>' +
          '</div>' +
          '</div>'
      );
      done();
    }

    run(app, {
      html: makeHTMLDriver(effect),
    });
  });

  it('should report errors thrown in snabbdom-to-html', function(done) {
    const sandbox = sinon.createSandbox();
    sandbox.stub(console, 'error');

    function app() {
      return {
        html: xs.of('invalid snabbdom' as any),
      };
    }

    run(app, {
      html: makeHTMLDriver(() => {}),
    });

    setTimeout(() => {
      sinon.assert.calledOnce(console.error as any);
      sandbox.restore();
      done();
    }, 10);
  });
});
