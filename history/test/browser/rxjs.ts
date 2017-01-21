/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';
import {Observable} from 'rxjs';
import {setup, run} from '@cycle/rxjs-run';
import {makeHashHistoryDriver, captureClicks, Location, HistoryInput} from '../../src';

let dispose = () => {};

describe('historyDriver - RxJS', () => {
  beforeEach(function () {
    dispose();
  });

  it('should return a stream', () => {
    function main(sources: {history: Observable<Location>}) {
      assert.strictEqual(typeof sources.history.switchMap, 'function');
      return {
        history: Observable.never(),
      };
    }

    const {sources, run} = setup(main, { history: makeHashHistoryDriver() });
    assert.strictEqual(typeof sources.history.switchMap, 'function');
  });

  it('should create a location from pathname', function (done) {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of('/test'),
      };
    }

    const {sources, run} = setup(main, { history: makeHashHistoryDriver() });

    sources.history.subscribe({
      next (location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => { done('complete should not be called'); },
    });
    dispose = run();
  });

  it('should create a location from PushHistoryInput', function (done) {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of({type: 'push', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, { history: makeHashHistoryDriver() });

    sources.history.subscribe({
      next (location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => { done('complete should not be called'); },
    });
    dispose = run();
  });

  it('should create a location from ReplaceHistoryInput', function (done) {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of({type: 'replace', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, { history: makeHashHistoryDriver() });

    sources.history.subscribe({
      next (location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => { done('complete should not be called'); },
    });
    dispose = run();
  });

  it('should allow going back/forwards with `go`, `goBack`, `goForward`', function (done) {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.interval(100).take(6).map(i => [
          '/test',
          '/other',
          {type: 'go', amount: -1},
          {type: 'go', amount: +1},
          {type: 'goBack'},
          {type: 'goForward'},
        ][i]),
      };
    }

    const {sources, run} = setup(main, { history: makeHashHistoryDriver() });

    const expected = [
      '/test',
      '/other',
      '/test',
      '/other',
      '/test',
      '/other',
    ];

    sources.history.subscribe({
      next (location: Location) {
        assert.strictEqual(location.pathname, expected.shift());
        if (expected.length === 0) {
          done();
        }
      },
      error: done,
      complete: () => { done('complete should not be called'); },
    });
    dispose = run();
  });
});
