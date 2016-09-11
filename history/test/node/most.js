import * as assert from 'assert';

import * as most from 'most';
import Cycle from '@cycle/most-run';
import MostAdapter from '@cycle/most-adapter';
import {
  makeHistoryDriver,
  createServerHistory,
  createLocation,
  supportsHistory
} from '../../lib/index';
require('es6-promise').polyfill();

const locationDefaults = {
  pathname: '/',
  action: 'POP',
  hash: '',
  search: '',
  state: null,
  key: null,
  query: null,
};

describe('History - Most', () => {

  describe('createLocation', () => {
    it(`should return a full location with no parameter`, () => {
      assert.deepEqual(createLocation(), locationDefaults);
    });

    it(`should accept just a string as the pathname`, () => {
      assert.deepEqual(createLocation(`/`), locationDefaults);
    });

    it(`should accept an object of location parameters`, () => {
      const location = createLocation({pathname: `/some/path`, state: {the: `state`}});
      const refLocattion = Object.assign(locationDefaults, {
        pathname: `/some/path`, state: {the: `state`},
      });

      assert.deepEqual(location, refLocattion);
    });
  });

  describe(`supportsHistory`, () => {
    it(`should return false if run on the server`, () => {
      assert.strictEqual(supportsHistory(), false);
    });
  });

  describe('createServerHistory', () => {
    it(`should be an object`, () => {
      const history = createServerHistory();
      assert.strictEqual(typeof history, `object`);
      assert.strictEqual(typeof history.push, `function`);
      assert.strictEqual(typeof history.listen, `function`);
      assert.strictEqual(typeof history.replace, `function`);
    });

    it(`should return a function when .listen() is called`, () => {
      const history = createServerHistory();
      const unlisten = history.listen(() => { return void 0; });
      assert.strictEqual(typeof unlisten, `function`);
      unlisten();
    });

    it(`should allow pushing locations`, (done) => {
      const history = createServerHistory();
      history.listen(location => {
        assert.strictEqual(typeof location, `object`);
        assert.strictEqual(location.pathname, `/some/path`);
        done();
      });
      history.push(`/some/path`);
    });

    it(`should create an href`, () => {
      const history = createServerHistory();
      assert.strictEqual(history.createHref(`/some/path`), `/some/path`);
    });

    it(`should create a location`, () => {
      const history = createServerHistory();
      const location = history.createLocation(`/some/path`);
      assert.strictEqual(typeof location, `object`);
      assert.strictEqual(location.pathname, `/some/path`);
      assert.strictEqual(location.state, undefined);
      assert.strictEqual(location.query, null);
    });
  });

  describe(`historyDriver`, () => {
    it(`should throw if not given a valid history object`, () => {
      assert.throws(() => {
        makeHistoryDriver();
      }, TypeError);
    });

    it(`should return a stream with createHref() and createLocation() methods`,
      () => {
        const history = createServerHistory();
        const history$ = makeHistoryDriver(history)(most.of(`/`), MostAdapter);

        assert.strictEqual(history$ instanceof most.Stream, true);
        assert.strictEqual(typeof history$.createHref, `function`);
        assert.strictEqual(typeof history$.createLocation, `function`);
      });

    it('should allow pushing to a history object', (done) => {
      const history = createServerHistory('/test');
      const app = () => ({})
      const {sources, run} = Cycle(app, {
        history: makeHistoryDriver(history)
      })

      let dispose;
      sources.history.subscribe({
        next(location) {
          assert.strictEqual(location.pathname, '/test');
          setTimeout(() => {
            dispose();
            done();
          })
        },
        error: () => {},
        complete: () => {}
      })
      dispose = run();
    })

    it(`should return a location to application`, (done) => {
      const app = () => ({history: most.of(`/`)});
      const {sources, run} = Cycle(app, {
        history: makeHistoryDriver(createServerHistory()),
      });

      let dispose;
      sources.history.subscribe({
        next: (location) => {
          assert.strictEqual(typeof location, `object`);
          assert.strictEqual(location.pathname, `/`);
          assert.strictEqual(location.state, undefined);
          setTimeout(() => {
            dispose();
            done();
          });
        },
        error() { return void 0; },
        complete() { return void 0; },
      });
      dispose = run();
    });

    it(`should allow replacing a location`, (done) => {
      const app = () => ({
        history: most.of({
          type: `replace`,
          pathname: `/`,
        }),
      });
      const {sources, run} = Cycle(app, {
        history: makeHistoryDriver(createServerHistory()),
      });

      let dispose;
      sources.history.subscribe({
        next(location) {
          assert.strictEqual(typeof location, `object`);
          assert.strictEqual(location.pathname, `/`);
          assert.strictEqual(location.state, undefined);
          setTimeout(() => {
            dispose();
            done();
          });
        },
        error() { return void 0; },
        complete() { return void 0; },
      });
      dispose = run();
    });
  });

  it('should allow killing the stream with serverHistory.complete()', () => {
    const app = () => ({});

    const history = createServerHistory();
    const {sources, run} = Cycle(app, {
      history: makeHistoryDriver(history),
    });

    const expected = ['/path', '/other']

    let dispose;
    sources.history.subscribe({
      next(location) {
        assert.strictEqual(typeof location, `object`);
        assert.strictEqual(location.pathname, expected.shift());
        if (expected.length === 0) {
          setTimeout(() => history.complete(), 0)
        }
      },
      error() { return void 0; },
      complete() {
        assert.strictEqual(expected.length, 0)
        setTimeout(() => {
          dispose();
          done();
        });
      },
    });
    dispose = run();

    history.push('/path');
    history.push('/other');
  });
});
