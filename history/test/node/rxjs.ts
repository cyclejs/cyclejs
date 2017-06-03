/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';
import {Observable} from 'rxjs';
import {setup, run} from '@cycle/rxjs-run';
import {makeServerHistoryDriver, Location, HistoryInput} from '../../src';

describe('serverHistoryDriver - RxJS', function() {
  it('should return an Rx Observable as source', function() {
    function main(sources: {history: Observable<Location>}) {
      assert.strictEqual(typeof sources.history.switchMap, 'function');
      return {
        history: Observable.never(),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });
    assert.strictEqual(typeof sources.history.switchMap, 'function');
  });

  it('should create a location from pathname', done => {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of('/test'),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

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
    run();
  });

  it('should create a location from PushHistoryInput', done => {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of({type: 'push', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

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
    run();
  });

  it('should create a location from ReplaceHistoryInput', done => {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of({type: 'replace', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

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
    run();
  });

  it('should allow going back a route with type `go`', done => {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of<HistoryInput | string>('/test', '/other', {
          type: 'go',
          amount: -1,
        }),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test'];

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
    run();
  });

  it('should allow going back a route with type `goBack`', done => {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of<HistoryInput | string>('/test', '/other', {
          type: 'goBack',
        }),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test'];

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
    run();
  });

  it('should allow going forward a route with type `go`', done => {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of<HistoryInput | string>(
          '/test',
          '/other',
          {type: 'go', amount: -1},
          {type: 'go', amount: 1},
        ),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test', '/other'];

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
    run();
  });

  it('should allow going forward a route with type `goForward`', done => {
    function main(sources: {history: Observable<Location>}) {
      return {
        history: Observable.of<HistoryInput | string>(
          '/test',
          '/other',
          {type: 'go', amount: -1},
          {type: 'goForward'},
        ),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test', '/other'];

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
    run();
  });
});
