import * as assert from 'assert';
import * as Rx from 'rxjs';
import * as Cycle from '@cycle/rxjs-run';
import {makeHTTPDriver} from '../../../lib/index';
import {HTTPSource} from '../../../rxjs-typings';
import {run as runCommon} from './common';

const uri = '//' + window.location.host;
runCommon(uri);

(global as any).mocha.globals(['Cyclejs']);

describe('HTTP Driver in the browser', function() {
  it('should be able to emit progress events on the response stream', function(
    done,
  ) {
    function main(sources: {HTTP: HTTPSource}) {
      return {
        HTTP: Rx.Observable.of({
          url: uri + '/querystring',
          method: 'GET',
          progress: true,
          query: {foo: 102030, bar: 'Pub'},
        }),
      };
    }
    const {sources, run} = Cycle.setup(main, {HTTP: makeHTTPDriver()});
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
            assert.strictEqual(typeof (response as any).total, 'number');
            progressEventHappened = true;
          } else {
            assert.strictEqual(progressEventHappened, true);
            assert.strictEqual(response.status, 200);
            assert.strictEqual((response.body as any).foo, '102030');
            assert.strictEqual((response.body as any).bar, 'Pub');
            done();
          }
        });
      },
    });

    run();
  });

  it('should return binary response when responseType option is arraybuffer', function(
    done,
  ) {
    function main(sources: {HTTP: HTTPSource}) {
      return {
        HTTP: Rx.Observable.of({
          url: uri + '/binary',
          method: 'GET',
          responseType: 'arraybuffer',
        }),
      };
    }

    const {sources, run} = Cycle.setup(main, {HTTP: makeHTTPDriver()});

    const response$$ = sources.HTTP.select();
    response$$.subscribe(function(response$) {
      assert.strictEqual(response$.request.url, uri + '/binary');
      assert.strictEqual(response$.request.method, 'GET');
      assert.strictEqual(response$.request.responseType, 'arraybuffer');
      response$.subscribe(function(response) {
        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(
          new Uint8Array(response.body),
          new Uint8Array([1, 2, 3]),
        );
        done();
      });
    });
    run();
  });

  it('should return binary response when responseType option is blob', function(
    done,
  ) {
    function main(sources: {HTTP: HTTPSource}) {
      return {
        HTTP: Rx.Observable.of({
          url: uri + '/binary',
          method: 'GET',
          responseType: 'blob',
        }),
      };
    }

    const {sources, run} = Cycle.setup(main, {HTTP: makeHTTPDriver()});

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
            new Uint8Array(fr.result),
            new Uint8Array([1, 2, 3]),
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

  it('should not have cross-driver race conditions (#592)', function(done) {
    this.timeout(5500);

    function child(sources: any, num: any) {
      const vdom$ = sources.HTTP
        .select('cat')
        .mergeAll()
        .map((res: any) => 'My name is ' + res.text);

      const request$ = num === 1
        ? Rx.Observable.of({
            category: 'cat',
            url: uri + '/hello',
          })
        : Rx.Observable.never();

      return {
        HTTP: request$,
        DOM: vdom$,
      };
    }

    function mainHTTPThenDOM(sources: any) {
      const sinks$ = Rx.Observable.interval(300).take(6).map(i => {
        if (i % 2 === 1) {
          return child(sources, i);
        } else {
          return {
            HTTP: Rx.Observable.empty(),
            DOM: Rx.Observable.of(''),
          };
        }
      });

      // order of sinks is important
      return {
        HTTP: sinks$.switchMap(sinks => sinks.HTTP),
        DOM: sinks$.switchMap(sinks => sinks.DOM),
      };
    }

    function mainDOMThenHTTP(sources: any) {
      const sinks$ = Rx.Observable.interval(300).take(6).map(i => {
        if (i % 2 === 1) {
          return child(sources, i);
        } else {
          return {
            HTTP: Rx.Observable.empty(),
            DOM: Rx.Observable.of(''),
          };
        }
      });

      // order of sinks is important
      return {
        DOM: sinks$.switchMap(sinks => sinks.DOM),
        HTTP: sinks$.switchMap(sinks => sinks.HTTP),
      };
    }

    const expectedDOMSinks = [
      /* HTTP then DOM: */ '',
      'My name is Hello World',
      '',
      '',
      /* DOM then HTTP: */ '',
      'My name is Hello World',
      '',
      '',
    ];

    function domDriver(sink: any) {
      sink.addListener({
        next: s => {
          assert.strictEqual(s, expectedDOMSinks.shift());
        },
        error: (err: any) => {},
      });
    }

    // HTTP then DOM:
    Cycle.run(mainHTTPThenDOM, {
      HTTP: makeHTTPDriver(),
      DOM: domDriver,
    });
    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 4);

      // DOM then HTTP:
      Cycle.run(mainDOMThenHTTP, {
        HTTP: makeHTTPDriver(),
        DOM: domDriver,
      });
      setTimeout(() => {
        assert.strictEqual(expectedDOMSinks.length, 0);
        done();
      }, 2400);
    }, 2400);
  });
});
