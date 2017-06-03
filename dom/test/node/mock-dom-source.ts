import 'mocha';
import * as assert from 'assert';
import * as Rx from 'rxjs';
import {Observable} from 'rxjs';
import {setup} from '@cycle/rxjs-run';
import {h3, h4, h2, div, h, mockDOMSource, MockedDOMSource} from '../../lib';

describe('mockDOMSource', function() {
  it('should be in accessible in the API', function() {
    assert.strictEqual(typeof mockDOMSource, 'function');
  });

  it('should make an Observable for clicks on `.foo`', function(done) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: Observable.of(135),
      },
    });
    userEvents.select('.foo').events('click').subscribe({
      next: (ev: any) => {
        assert.strictEqual(ev, 135);
        done();
      },
      error: (err: any) => done(err),
      complete: () => {},
    });
  });

  it('should make multiple user event Observables', function(done) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: Observable.of(135),
      },
      '.bar': {
        scroll: Observable.of(2),
      },
    });
    Observable.combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.bar').events('scroll'),
      (a: number, b: number) => a * b,
    ).subscribe({
      next: ev => {
        assert.strictEqual(ev, 270);
        done();
      },
      error: err => done(err),
      complete: () => {},
    });
  });

  it('should make multiple user event Observables on the same selector', function(
    done,
  ) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: Observable.of(135),
        scroll: Observable.of(3),
      },
    });
    Observable.combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.foo').events('scroll'),
      (a: number, b: number) => a * b,
    ).subscribe({
      next: ev => {
        assert.strictEqual(ev, 405);
        done();
      },
      error: err => done(err),
      complete: () => {},
    });
  });

  it('should return an empty Observable if query does not match', function(
    done,
  ) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: Observable.of(135),
      },
    });
    userEvents.select('.impossible').events('scroll').subscribe({
      next: (x: any) => done(x),
      error: (e: any) => done(e),
      complete: () => done(),
    });
  });

  it('should return empty Observable for select().elements and none is defined', function(
    done,
  ) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: Observable.of(135),
      },
    });
    userEvents.select('.foo').elements().subscribe({
      next: (x: any) => done(x),
      error: (e: any) => done(e),
      complete: () => done(),
    });
  });

  it('should return defined Observable for select().elements', function(done) {
    const mockedDOMSource = mockDOMSource({
      '.foo': {
        elements: Observable.of(135),
      },
    });
    mockedDOMSource.select('.foo').elements().subscribe({
      next: (e: any) => {
        assert.strictEqual(e, 135);
        done();
      },
      error: (err: any) => done(err),
      complete: () => {},
    });
  });

  it('should have DevTools flag in elements() source stream', function(done) {
    const mockedDOMSource = mockDOMSource({
      '.foo': {
        elements: Observable.of(135),
      },
    });
    assert.strictEqual(
      (mockedDOMSource.select('.foo').elements() as any)._isCycleSource,
      'MockedDOM',
    );
    done();
  });

  it('should have DevTools flag in events() source stream', function(done) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: Observable.of(135),
      },
    });
    assert.strictEqual(
      (userEvents.select('.foo').events('click') as any)._isCycleSource,
      'MockedDOM',
    );
    done();
  });

  it('should return defined Observable when chaining .select()', function(
    done,
  ) {
    const mockedDOMSource = mockDOMSource({
      '.bar': {
        '.foo': {
          '.baz': {
            elements: Observable.of(135),
          },
        },
      },
    });
    mockedDOMSource
      .select('.bar')
      .select('.foo')
      .select('.baz')
      .elements()
      .subscribe({
        next: (e: any) => {
          assert.strictEqual(e, 135);
          done();
        },
        error: (err: any) => done(err),
        complete: () => {},
      });
  });

  it('multiple .select()s should not throw when given empty mockedSelectors', () => {
    assert.doesNotThrow(() => {
      const DOM = mockDOMSource({});
      DOM.select('.something').select('.other').events('click');
    });
  });

  it('multiple .select()s should return some observable if not defined', () => {
    const DOM = mockDOMSource({});
    const domSource = DOM.select('.something').select('.other');
    assert.strictEqual(
      typeof (domSource.events('click') as any).observeOn,
      'function',
      'domSource.events(click) should be an Observable instance',
    );
    assert.strictEqual(
      typeof (domSource.elements() as any).observeOn,
      'function',
      'domSource.elements() should be an Observable instance',
    );
  });
});

describe('isolation on MockedDOMSource', function() {
  it('should have the same effect as DOM.select()', function(done) {
    function app(sources: {DOM: MockedDOMSource}) {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.child.___foo', [h4('.bar', 'Correct')]),
          ]),
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: () =>
        mockDOMSource({
          '.___foo': {
            '.bar': {
              elements: Observable.of<any>('skipped', 135),
            },
          },
        }),
    });

    let dispose: any;
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    // Make assertions
    (isolatedDOMSource.select('.bar').elements() as any)
      .skip(1)
      .take(1)
      .subscribe((elements: number) => {
        assert.strictEqual(elements, 135);
        setTimeout(() => {
          dispose();
          done();
        });
      });
    dispose = run();
  });

  it('should have isolateSource and isolateSink', function(done) {
    function app(sources: {DOM: MockedDOMSource}) {
      return {
        DOM: Rx.Observable.of(h('h3.top-most.___foo')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: () => mockDOMSource({}),
    });
    const dispose = run();
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');
    // Make assertions
    assert.strictEqual(typeof isolatedDOMSource.isolateSource, 'function');
    assert.strictEqual(typeof isolatedDOMSource.isolateSink, 'function');
    dispose();
    done();
  });

  it('should prevent parent from DOM.selecting() inside the isolation', function(
    done,
  ) {
    function app(sources: {DOM: MockedDOMSource}): any {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            sources.DOM.isolateSink(
              Rx.Observable.of(div('.foo', [h4('.bar', 'Wrong')])),
              'ISOLATION',
            ),
            h2('.bar', 'Correct'),
          ]),
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: () =>
        mockDOMSource({
          '.___ISOLATION': {
            '.bar': {
              elements: Rx.Observable.of('skipped', 'Wrong'),
            },
          },
          '.bar': {
            elements: Rx.Observable.of('skipped', 'Correct'),
          },
        }),
    });

    sources.DOM
      .select('.bar')
      .elements()
      .skip(1)
      .take(1)
      .subscribe(function(x: any) {
        assert.strictEqual(x, 'Correct');
        done();
      });
    run();
  });
});
