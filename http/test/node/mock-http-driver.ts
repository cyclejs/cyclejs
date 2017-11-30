import 'mocha';
import * as assert from 'assert';
import {mockHTTPDriver} from '../../src/mockHTTPDriver';
import xs from 'xstream';
import {setup} from '../../../run/src';
import {setAdapt} from '../../../run/src/adapt';

let dispose: Function | null = null;

describe('mockHTTPDriver', function() {
  beforeEach(function() {
    setAdapt(x => x);
  });

  afterEach(function() {
    if (dispose) {
      dispose();
      dispose = null;
    }
  })

  it('mocks requests', function(done) {
    function main(sources: any) {
      return {
        HTTP: xs.of('http://foo.bar'),
        response$: sources.HTTP.select().flatten(),
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

    const {sinks, run} = setup(main, drivers);

    dispose = run();

    sinks.response$.take(1).addListener({
      next(res: Response) {
        assert.equal(res.body, 'hi');
        assert.equal(res.status, 200);

        done();
      },

      error: done,
    });
  });

  it('throw instead of making real requests if you made a mistake in your config', function(done) {
    function main(sources: any) {
      return {
        HTTP: xs.of('http://foo.bar'),
        response$: sources.HTTP.select().flatten(),
      };
    }

    const drivers = {
      HTTP: mockHTTPDriver([
        {
          pattern: 'http://foo.babar', // @NOTE: I made a "mistake" in my pattern
          fixtures: () => {},
        },
      ]),
    };

    const {sinks, run} = setup(main, drivers);

    dispose = run();

    sinks.response$.take(1).addListener({
      next: () => {
        done(new Error('should not go there'));
      },
      error: () => {
        done();
      },
    });
  });
});
