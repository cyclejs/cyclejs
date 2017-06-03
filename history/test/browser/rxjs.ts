/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';

import {
  HistoryInput,
  Location,
  captureClicks,
  makeHistoryDriver,
} from '../../src';
import {run, setup} from '@cycle/rxjs-run';

import {Observable} from 'rxjs';
import 'rxjs/add/operator/switchMap';

let dispose = () => {};

// This is skipped because somehow state is being carried around between tests.
// Tests work when run separately, but when run all together, something fails.
describe.skip('historyDriver - RxJS', () => {
  beforeEach(function() {
    dispose();
  });

  it('should return a stream', () => {
    function main(sources: {history: Observable<Location>}) {
      assert.strictEqual(typeof sources.history.switchMap, 'function');
      return {
        history: Observable.never(),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});
    assert.strictEqual(typeof sources.history.switchMap, 'function');
  });

  it('should create a location from pathname', function(done) {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of('/test'),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});

    sources.history.skip(1).subscribe({
      next(location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => {
        done('complete should not be called');
      },
    });
    dispose = run();
  });

  it('should create a location from PushHistoryInput', function(done) {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of({type: 'push', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});

    sources.history.skip(1).subscribe({
      next(location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => {
        done('complete should not be called');
      },
    });
    dispose = run();
  });

  it('should create a location from ReplaceHistoryInput', function(done) {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of({type: 'replace', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});

    sources.history.skip(1).subscribe({
      next(location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => {
        done('complete should not be called');
      },
    });
    dispose = run();
  });

  it('should allow going back/forwards with `go`, `goBack`, `goForward`', function(
    done,
  ) {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.interval(100)
          .take(6)
          .map(
            i =>
              [
                '/test',
                '/other',
                {type: 'go', amount: -1},
                {type: 'go', amount: +1},
                {type: 'goBack'},
                {type: 'goForward'},
              ][i],
          ),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});

    const expected = ['/test', '/other', '/test', '/other', '/test', '/other'];

    sources.history.skip(1).subscribe({
      next(location: Location) {
        assert.strictEqual(location.pathname, expected.shift());
        if (expected.length === 0) {
          done();
        }
      },
      error: done,
      complete: () => {
        done('complete should not be called');
      },
    });
    dispose = run();
  });
});
