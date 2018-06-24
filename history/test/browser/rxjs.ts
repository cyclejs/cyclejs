/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';

import {
  HistoryInput,
  Location,
  captureClicks,
  makeHistoryDriver,
} from '../../src';
import {setup} from '@cycle/rxjs-run';
import {setAdapt} from '@cycle/run/lib/adapt';

import {Observable, Subscription} from 'rxjs';
import 'rxjs/add/operator/switchMap';

let dispose = () => {};
let sub: Subscription | undefined;

describe('historyDriver - RxJS', () => {
  beforeEach(function() {
    setAdapt(stream => Observable.from(stream));
  });

  afterEach(function() {
    if (sub) {
      sub.unsubscribe();
    }
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

    sub = sources.history.skip(1).subscribe({
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

    sub = sources.history.skip(1).subscribe({
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

    sub = sources.history.skip(1).subscribe({
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

    sub = sources.history.skip(1).subscribe({
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
