import {
  combineWith,
  drop,
  fromArray,
  map,
  of,
  pipe,
  subscribe,
  take,
} from '@cycle/callbags';
import { setup } from '@cycle/run';
import * as assert from 'assert';
import {
  h3,
  h4,
  h2,
  div,
  h,
  DomApi,
  VNode,
  makeMockDomPlugin,
  elementSymbol,
} from '../../src/index';

const noop = () => ({});

describe('mockDOMSource', function () {
  it('should make an Observable for clicks on `.foo`', function (done) {
    const mockDomPlugin = makeMockDomPlugin({
      selector: {
        '.foo': {
          data: {
            click: of({ value: 135 }),
          },
        },
      },
    });

    const { sources } = setup(noop, { DOM: mockDomPlugin });
    pipe(
      sources.DOM.select('.foo').events('click'),
      subscribe((ev: any) => {
        assert.strictEqual(ev.value, 135);
        done();
      })
    );
  });

  it('should make multiple user event Observables', function (done) {
    const mockDomPlugin = makeMockDomPlugin({
      selector: {
        '.foo': {
          data: {
            click: of({ value: 135 }),
          },
        },
        '.bar': {
          data: {
            scroll: of({ value: 2 }),
          },
        },
      },
    });

    const { sources } = setup(noop, { DOM: mockDomPlugin });

    pipe(
      combineWith(
        (a: any, b: any) => a.value * b.value,
        sources.DOM.select('.foo').events('click'),
        sources.DOM.select('.bar').events('scroll')
      ),
      subscribe(ev => {
        assert.strictEqual(ev, 270);
        done();
      })
    );
  });

  it('should make multiple user event Observables on the same selector', function (done) {
    const mockDomPlugin = makeMockDomPlugin({
      selector: {
        '.foo': {
          data: {
            click: of({ value: 135 }),
            scroll: of({ value: 3 }),
          },
        },
      },
    });

    const { sources } = setup(noop, { DOM: mockDomPlugin });

    pipe(
      combineWith(
        (a: any, b: any) => a.value * b.value,
        sources.DOM.select('.foo').events('click'),
        sources.DOM.select('.foo').events('scroll')
      ),
      subscribe(ev => {
        assert.strictEqual(ev, 405);
        done();
      })
    );
  });

  it('should return an Observable if query does not match', function (done) {
    const mockDomPlugin = makeMockDomPlugin({
      selector: {
        '.foo': {
          data: {
            click: of({ value: 135 }),
          },
        },
      },
    });

    const { sources } = setup(noop, { DOM: mockDomPlugin });

    pipe(
      sources.DOM.select('.impossible').events('scroll'),
      subscribe(done, () => assert.fail('should not complete'))
    );

    setTimeout(done, 20);
  });

  it('should return an Observable for select().elements and none is defined', function (done) {
    const mockDomPlugin = makeMockDomPlugin({
      selector: {
        '.foo': {
          data: {
            click: of({ value: 135 }),
          },
        },
      },
    });

    const { sources } = setup(noop, { DOM: mockDomPlugin });

    pipe(
      sources.DOM.select('.foo').elements(),
      subscribe(done, () => assert.fail('should not complete'))
    );

    setTimeout(done, 20);
  });

  it('should return defined Observable for select().elements', function (done) {
    const mockDomPlugin = makeMockDomPlugin({
      selector: {
        '.foo': {
          data: {
            [elementSymbol]: of({ value: 135 }),
          },
        },
      },
    });

    const { sources } = setup(noop, { DOM: mockDomPlugin });

    pipe(
      sources.DOM.select('.foo').elements(),
      subscribe((e: any) => {
        assert.strictEqual(e.value, 135);
        done();
      })
    );
  });

  it('should return defined Observable when chaining .select()', function (done) {
    const mockDomPlugin = makeMockDomPlugin({
      selector: {
        '.bar .foo .baz': {
          data: {
            [elementSymbol]: of({ value: 135 }),
          },
        },
      },
    });

    const { sources } = setup(noop, { DOM: mockDomPlugin });

    pipe(
      sources.DOM.select('.bar').select('.foo').select('.baz').elements(),
      subscribe((e: any) => {
        assert.strictEqual(e.value, 135);
        done();
      })
    );
  });

  it('multiple .select()s should not throw when given empty mockedSelectors', () => {
    assert.doesNotThrow(() => {
      const mockDomPlugin = makeMockDomPlugin({});

      const { sources } = setup(noop, { DOM: mockDomPlugin });

      sources.DOM.select('.something').select('.other').events('click');
    });
  });

  it('multiple .select()s should return some observable if not defined', () => {
    const mockDomPlugin = makeMockDomPlugin({});

    const { sources } = setup(noop, { DOM: mockDomPlugin });

    const domSource = sources.DOM.select('.something').select('.other');
    assert.strictEqual(
      typeof domSource.events('click'),
      'function',
      'domSource.events(click) should be an Observable instance'
    );
    assert.strictEqual(
      typeof domSource.elements(),
      'function',
      'domSource.elements() should be an Observable instance'
    );
  });
});

describe('isolation on MockedDOMSource', function () {
  it('should have the same effect as DOM.select()', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.child.___foo', [h4('.bar', 'Correct')]),
          ])
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeMockDomPlugin({
        total: {
          foo: {
            selector: {
              '.bar': {
                data: {
                  [elementSymbol]: fromArray(['skipped', 135]),
                },
              },
            },
          },
        },
      }),
    });

    let dispose: any;
    const isolatedDOMSource = sources.DOM.isolateSource('foo');

    // Make assertions
    pipe(
      isolatedDOMSource.select('.bar').elements(),
      drop(1),
      take(1),
      subscribe((e: any) => {
        assert.strictEqual(e, 135);
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should have isolateSource and isolateSink', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(h('h3.top-most.___foo')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeMockDomPlugin({}),
    });
    const dispose = run();
    const isolatedDOMSource = sources.DOM.isolateSource('foo');
    // Make assertions
    assert.strictEqual(typeof isolatedDOMSource.isolateSource, 'function');
    assert.strictEqual(typeof isolatedDOMSource.isolateSink, 'function');
    dispose();
    done();
  });

  it('should prevent parent from DOM.selecting() inside the isolation', function (done) {
    function app(_sources: { DOM: DomApi }) {
      const child$ = _sources.DOM.isolateSink(
        of(div('.foo', [h4('.bar', 'Wrong')])),
        'ISOLATION'
      );
      return {
        DOM: map((child: any) =>
          h3('.top-most', [child, h2('.bar', 'Correct')])
        )(child$),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeMockDomPlugin({
        total: {
          ISOLATION: {
            selector: {
              '.bar': {
                data: { [elementSymbol]: fromArray(['skipped', 'Wrong']) },
              },
            },
          },
        },
        selector: {
          '.bar': {
            data: { [elementSymbol]: fromArray(['skipped', 'Correct']) },
          },
        },
      }),
    });

    pipe(
      sources.DOM.select('.bar').elements(),
      drop(1),
      take(1),
      subscribe((x: any) => {
        assert.strictEqual(x, 'Correct');
        done();
      })
    );
    run();
  });
});
