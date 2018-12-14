import 'symbol-observable'; //tslint:disable-line
import * as assert from 'assert';
import {mockHTTPDriver} from '../../src/mockHTTPDriver';
import xs from 'xstream';
import {setup} from '../../../run/src';

let dispose: Function | null = null;

describe('mockHTTPDriver', function() {
  afterEach(function() {
    if (dispose) {
      dispose();
      dispose = null;
    }
  });

  it('mocks requests', function(done) {
    function main() {
      return {
        HTTP: xs.of('http://foo.bar'),
      };
    }

    const drivers = {
      HTTP: mockHTTPDriver([
        {
          pattern: 'http://foo.bar',
          fixtures: () => ({body: 'hi', status: 200}),
          callback: (match: any, data: any) => data,
        },
      ]),
    };

    const {sources, run} = setup(main, drivers);

    sources.HTTP.select().subscribe({
      next(response$) {
        assert.strictEqual(response$.request.url, 'http://foo.bar');
        response$.subscribe({
          next: res => {
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body, 'hi');
            done();
          },
          error: done,
        });
      },
      error: done,
    });

    dispose = run();
  });

  it('throw instead of making real requests if you made a mistake in your config', function(done) {
    function main() {
      return {
        HTTP: xs.of('http://foo.bar'),
      };
    }

    const drivers = {
      HTTP: mockHTTPDriver([
        {
          // @NOTE: Notice the "mistake" in the pattern
          pattern: 'http://foo.babar',
          fixtures: () => {},
        },
      ]),
    };

    const {sources, run} = setup(main, drivers);

    sources.HTTP.select().subscribe({
      next: response$ => {
        assert.strictEqual(response$.request.url, 'http://foo.bar');
        response$.subscribe({
          next: () => {
            done(new Error('should not go there'));
          },
          error: err => {
            assert.strictEqual(
              err.message,
              'You did not provide a sufficient config to catch all requests'
            );
            done();
          },
        });
      },
      error: done,
    });

    dispose = run();
  });
});
