import * as assert from 'assert';
import * as Rx from 'rxjs';
import * as Cycle from '@cycle/rxjs-run';
import {makeHTTPDriver} from '../../../lib/index';
import {HTTPSource} from '../../../rxjs-typings';
import {run as runCommon} from './common';

const uri = '//' + window.location.host;
runCommon(uri);

(global as any).mocha.globals(['Cyclejs']);

describe('HTTP Driver in the browser', function () {
  it('should be able to emit progress events on the response stream', function(done) {
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
    const {sources, run} = Cycle.setup(main, { HTTP: makeHTTPDriver() });
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
});
