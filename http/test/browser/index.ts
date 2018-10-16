import * as assert from 'assert';
import {Observable, of, never, interval, empty} from 'rxjs';
import {
  map,
  mergeMap,
  switchMap,
  publishReplay,
  refCount,
  take,
  delay,
  mergeAll,
} from 'rxjs/operators';
import {setup, run as globalRun} from '@cycle/rxjs-run';
import {HTTPSource, makeHTTPDriver} from '../../src/rxjs';
import {runTests as runCommon} from './common';

const uri = '//' + window.location.host;
runCommon(uri);

(global as any).mocha.globals(['Cyclejs']);

describe('HTTP Driver in the browser', function() {
  it('should be able to emit progress events on the response stream', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: uri + '/querystring',
          method: 'GET',
          progress: true,
          query: {foo: 102030, bar: 'Pub'},
        }),
      };
    }
    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});
    const response$$ = sources.HTTP.select();

    response$$.subscribe({
      next: function(response$) {
        assert.strictEqual(response$.request.url, uri + '/querystring');
        assert.strictEqual(response$.request.method, 'GET');
        assert.strictEqual((response$.request.query as any).foo, 102030);
        assert.strictEqual((response$.request.query as any).bar, 'Pub');
        let progressEventHappened = false;
        response$.subscribe(function(response) {
          if (response.type === 'progress') {
            assert.strictEqual(typeof response.total, 'number');
            progressEventHappened = true;
          } else {
            assert.strictEqual(progressEventHappened, true);
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.foo, '102030');
            assert.strictEqual(response.body.bar, 'Pub');
            done();
          }
        });
      },
    });

    run();
  });

  it('should return binary response when responseType option is arraybuffer', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: uri + '/binary',
          method: 'GET',
          responseType: 'arraybuffer',
        }),
      };
    }

    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

    const response$$ = sources.HTTP.select();
    response$$.subscribe(function(response$) {
      assert.strictEqual(response$.request.url, uri + '/binary');
      assert.strictEqual(response$.request.method, 'GET');
      assert.strictEqual(response$.request.responseType, 'arraybuffer');
      response$.subscribe(function(response) {
        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(
          new Uint8Array(response.body),
          new Uint8Array([1, 2, 3])
        );
        done();
      });
    });
    run();
  });

  it('should return binary response when responseType option is blob', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: uri + '/binary',
          method: 'GET',
          responseType: 'blob',
        }),
      };
    }

    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

    const response$$ = sources.HTTP.select();
    response$$.subscribe(function(response$) {
      assert.strictEqual(response$.request.url, uri + '/binary');
      assert.strictEqual(response$.request.method, 'GET');
      assert.strictEqual(response$.request.responseType, 'blob');
      response$.subscribe(function(response) {
        assert.strictEqual(response.status, 200);
        const fr = new FileReader();
        fr.onload = ev => {
          assert.deepStrictEqual(
            new Uint8Array(fr.result as ArrayBuffer),
            new Uint8Array([1, 2, 3])
          );
          done();
        };
        fr.onerror = ev => {
          done('should not be called');
        };
        fr.readAsArrayBuffer(response.body);
      });
    });
    run();
  });

  it('should not have cross-driver race conditions, A (#592)', function(done) {
    this.timeout(10000);

    function child(_sources: any, num: any) {
      const vdom$ = _sources.HTTP.select('cat').pipe(
        mergeAll(),
        map((res: any) => 'My name is ' + res.text)
      );

      const request$ =
        num === 1
          ? of({
              category: 'cat',
              url: uri + '/hello',
            })
          : never();

      return {
        HTTP: request$,
        DOM: vdom$,
      };
    }

    function mainHTTPThenDOM(_sources: any) {
      const sinks$ = interval(1000).pipe(
        take(6),
        map(i => {
          if (i % 2 === 1) {
            return child(_sources, i);
          } else {
            return {
              HTTP: empty(),
              DOM: of(''),
            };
          }
        }),
        publishReplay(1),
        refCount()
      );

      // order of sinks is important
      return {
        HTTP: sinks$.pipe(switchMap(sinks => sinks.HTTP)),
        DOM: sinks$.pipe(switchMap(sinks => sinks.DOM)),
      };
    }

    const expectedDOMSinks = [
      /* HTTP then DOM: */ '',
      'My name is Hello World',
      '',
      '',
    ];

    function domDriver(sink: any) {
      sink.addListener({
        next: (s: any) => {
          assert.strictEqual(s, expectedDOMSinks.shift());
        },
        error: (err: any) => {},
      });
    }

    // HTTP then DOM:
    globalRun(mainHTTPThenDOM, {
      HTTP: makeHTTPDriver(),
      DOM: domDriver,
    });
    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 0);
      done();
    }, 8500);
  });

  it('should not have cross-driver race conditions, B (#592)', function(done) {
    this.timeout(10000);

    function child(_sources: any, num: any) {
      const vdom$ = _sources.HTTP.select('cat').pipe(
        mergeAll(),
        map((res: any) => 'My name is ' + res.text)
      );

      const request$ =
        num === 1
          ? of({
              category: 'cat',
              url: uri + '/hello',
            })
          : never();

      return {
        HTTP: request$,
        DOM: vdom$,
      };
    }

    function mainDOMThenHTTP(_sources: any) {
      const sinks$ = interval(1000).pipe(
        take(6),
        map(i => {
          if (i % 2 === 1) {
            return child(_sources, i);
          } else {
            return {
              HTTP: empty(),
              DOM: of(''),
            };
          }
        }),
        publishReplay(1),
        refCount()
      );

      // order of sinks is important
      return {
        DOM: sinks$.pipe(switchMap(sinks => sinks.DOM)),
        HTTP: sinks$.pipe(switchMap(sinks => sinks.HTTP)),
      };
    }

    const expectedDOMSinks = [
      /* DOM then HTTP: */ '',
      'My name is Hello World',
      '',
      '',
    ];

    function domDriver(sink: any) {
      sink.addListener({
        next: (s: any) => {
          assert.strictEqual(s, expectedDOMSinks.shift());
        },
        error: (err: any) => {},
      });
    }

    // HTTP then DOM:
    globalRun(mainDOMThenHTTP, {
      HTTP: makeHTTPDriver(),
      DOM: domDriver,
    });
    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 0);
      done();
    }, 8500);
  });

  it('should not remember past responses when selecting', function(done) {
    this.timeout(4000);

    function main(_sources: any) {
      const test$ = of(null).pipe(
        delay(1000),
        mergeMap(() =>
          _sources.HTTP.select('cat').pipe(
            mergeAll(),
            map((res: any) => 'I should not show this, ' + res.text)
          )
        )
      );

      const request$ = of({
        category: 'cat',
        url: uri + '/hello',
      });

      return {
        HTTP: request$,
        Test: test$,
      };
    }

    function testDriver(sink: any) {
      sink.addListener({
        next: (s: any) => {
          console.log(s);
          done('No data should come through the Test sink');
        },
        error: (err: any) => {
          done(err);
        },
      });
    }

    globalRun(main, {
      HTTP: makeHTTPDriver(),
      Test: testDriver,
    });

    setTimeout(() => {
      done();
    }, 2000);
  });
});
