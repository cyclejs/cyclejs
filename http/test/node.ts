import * as assert from 'assert';
import { of, filter, pipe, subscribe, flatten, map } from '@cycle/callbags';
import { makeRequest } from '@minireq/node';

import { run } from '@cycle/run';
import { HttpApi, makeHttpPlugin } from '../src/index';

import { runTests } from './common';

const uri = 'http://localhost:3000';

describe('HTTP Driver in Node.js', () => {
  const request = makeRequest();

  runTests(request);

  it('should auto-execute HTTP request when without listening to response stream', done => {
    function main(_sources: { HTTP: HttpApi }) {
      return {
        HTTP: of({
          url: uri + '/pet',
          method: 'POST',
          send: { name: 'Woof', species: 'Dog' },
          id: 0
        })
      };
    }

    const plugins = {
      HTTP: makeHttpPlugin(request)
    };

    run(main, plugins, []);

    setTimeout(() => {
      const { promise } = request({
        url: uri + '/petResponse',
        method: 'GET'
      });

      promise.then((res: any) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data, 'added Woof the Dog');
        done();
      });
    }, 200);
  });

  it('should handle errors when sending request via API to non-existent server', done => {
    function main(sources: { HTTP: HttpApi }) {
      pipe(
        sources.HTTP.get('http://localhost:9999'), // no server here
        subscribe(
          () => done('should not deliver data'),
          err => {
            assert.strictEqual(err.code, 'ECONNREFUSED');
            assert.strictEqual(err.port, 9999);
            done();
          }
        )
      );
    }

    const plugins = {
      HTTP: makeHttpPlugin(request)
    };

    run(main, plugins, []);
  });

  it('should handle errors when sending request via sinks to non-existent server', done => {
    function main(sources: { HTTP: HttpApi }) {
      pipe(
        sources.HTTP.response$$,
        filter(res$ => res$.request.id === 0),
        flatten,
        subscribe(
          () => done('should not deliver data'),
          err => {
            assert.strictEqual(err.code, 'ECONNREFUSED');
            assert.strictEqual(err.port, 9999);
            done();
          }
        )
      );

      return {
        HTTP: of({
          url: 'http://localhost:9999', // no server here
          method: 'GET',
          id: 0
        })
      };
    }

    const plugins = {
      HTTP: makeHttpPlugin(request)
    };

    run(main, plugins, []);
  });

  it('should throw on unhandled errors that reach the driver', done => {
    function main(sources: { HTTP: HttpApi }) {
      const req$ = pipe(
        sources.HTTP.get('http://localhost:9999'), // no server here
        map(x => ({
          url: uri,
          method: 'GET',
          send: x
        }))
      );

      return {
        HTTP: req$
      };
    }

    const handler = (err: any) => {
      assert.strictEqual(err.code, 'ECONNREFUSED');
      assert.strictEqual(err.port, 9999);
      done();
    };

    const plugins = {
      HTTP: makeHttpPlugin(request, handler)
    };

    run(main, plugins, []);
  });
});
