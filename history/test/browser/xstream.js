import * as assert from 'assert';

import xs from 'xstream';
import Cycle from '@cycle/xstream-run';
import XSAdapter from '@cycle/xstream-adapter';
import {makeDOMDriver, h} from '@cycle/dom';
import {createHistory} from 'history';
import {
  makeHistoryDriver,
  createServerHistory,
  createLocation,
  supportsHistory
} from '../../lib/index';

const locationDefaults = {
  pathname: '/',
  action: 'POP',
  hash: '',
  search: '',
  state: null,
  key: null,
  query: null,
};

function createRenderTarget(id = null) {
  let element = document.createElement(`div`);
  element.className = `cycletest`;
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
};

describe('History - XStream', () => {

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
    it(`should return true if the browser supports history API`, () => {
      assert.strictEqual(supportsHistory(), true);
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

    it(`should capture link clicks when capture === true`, done => {
      const pathname = window.location.pathname
      const app = () => ({DOM: xs.of(
        h(`div`, [
          h(`a.link`, {props: {href: pathname + `/hello`}}, `Hello`),
        ])
      )})

      const {sources, run} = Cycle(app, {
        DOM: makeDOMDriver(createRenderTarget()),
        history: makeHistoryDriver(createHistory(), {capture: true}),
      })

      let dispose;
      sources.history
        .filter(({action}) => action === `PUSH`)
        .addListener({
          next: location => {
            assert.strictEqual(typeof location, `object`);
            assert.strictEqual(location.pathname, pathname + `/hello`);
            setTimeout(() => {
              dispose();
              done();
            });
          },
          error: () => {},
          complete: () => {}
        });

      sources.DOM.elements().drop(1).take(1).addListener({
        next: (root) => {
          const element = root.querySelector(`.link`);
          assert.strictEqual(element.tagName, `A`);
          setTimeout(() => {
            element.click();
          }, 1000)
        },
        error: () => {},
        complete: () => {}
      });

      dispose = run();

    })

    it(`should return a stream with createHref() and createLocation() methods`,
      () => {
        const history = createServerHistory();
        const history$ = makeHistoryDriver(history)(xs.of(`/`), XSAdapter);

        assert.strictEqual(history$ instanceof xs, true);
        assert.strictEqual(typeof history$.createHref, `function`);
        assert.strictEqual(typeof history$.createLocation, `function`);
      });

    it('should allow pushing to a history object', (done) => {
      const history = createHistory();
      const app = () => ({})
      const {sources, run} = Cycle(app, {
        history: makeHistoryDriver(history)
      })

      let dispose;
      sources.history.filter(({action}) => action === 'PUSH').addListener({
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
      setTimeout(() => {
        dispose = run();
        history.push('/test')
      })
    })

    it(`should return a location to application`, (done) => {
      const app = () => ({history: xs.of(`/`)});
      const {sources, run} = Cycle(app, {
        history: makeHistoryDriver(createHistory()),
      });

      let dispose;
      sources.history.drop(1).take(1).addListener({
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
        history: xs.of({
          type: `replace`,
          pathname: `/`,
        }),
      });
      const {sources, run} = Cycle(app, {
        history: makeHistoryDriver(createHistory()),
      });

      let dispose;
      sources.history.drop(1).take(1).addListener({
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
});
