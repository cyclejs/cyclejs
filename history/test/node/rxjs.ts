import * as assert from 'assert';
import {Observable, of, never} from 'rxjs';
import {skip} from 'rxjs/operators';
import {setup} from '@cycle/rxjs-run';
import {
  makeServerHistoryDriver,
  Location,
  HistoryInput,
  PushHistoryInput,
  ReplaceHistoryInput,
} from '../../src';

describe('serverHistoryDriver - RxJS', function() {
  it('should return an Rx Observable as source', function() {
    function main(_sources: {history: Observable<Location>}) {
      assert.strictEqual(typeof _sources.history.pipe, 'function');
      return {
        history: never() as Observable<string>,
      };
    }

    const drivers = {
      history: makeServerHistoryDriver(),
    };

    const {sources, run} = setup(main, drivers);
    assert.strictEqual(typeof sources.history.pipe, 'function');
  });

  it('should create a location from pathname', done => {
    function main(_sources: {history: Observable<Location>}) {
      return {
        history: of('/test'),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    sources.history.pipe(skip(1)).subscribe({
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
    function main(_sources: {history: Observable<Location>}) {
      return {
        history: of<PushHistoryInput>({type: 'push', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    sources.history.pipe(skip(1)).subscribe({
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
    function main(_sources: {history: Observable<Location>}) {
      return {
        history: of<ReplaceHistoryInput>({type: 'replace', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    sources.history.pipe(skip(1)).subscribe({
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
    function main(_sources: {history: Observable<Location>}) {
      return {
        history: of<HistoryInput | string>('/test', '/other', {
          type: 'go',
          amount: -1,
        }),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test'];

    sources.history.pipe(skip(1)).subscribe({
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
    function main(_sources: {history: Observable<Location>}) {
      return {
        history: of<HistoryInput | string>('/test', '/other', {
          type: 'goBack',
        }),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test'];

    sources.history.pipe(skip(1)).subscribe({
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
    function main(_sources: {history: Observable<Location>}) {
      return {
        history: of<HistoryInput | string>(
          '/test',
          '/other',
          {type: 'go', amount: -1},
          {type: 'go', amount: 1}
        ),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test', '/other'];

    sources.history.pipe(skip(1)).subscribe({
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
    function main(_sources: {history: Observable<Location>}) {
      return {
        history: of<HistoryInput | string>(
          '/test',
          '/other',
          {type: 'go', amount: -1},
          {type: 'goForward'}
        ),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test', '/other'];

    sources.history.pipe(skip(1)).subscribe({
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
