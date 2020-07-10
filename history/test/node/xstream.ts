import * as assert from 'assert';
import xs, {Stream} from 'xstream';
import {setup} from '@cycle/run';
import {setAdapt} from '@cycle/run/lib/adapt';
import {
  makeServerHistoryDriver,
  Location,
  HistoryInput,
  PushHistoryInput,
  ReplaceHistoryInput,
} from '../../src';

describe('serverHistoryDriver - xstream', function() {
  beforeEach(function() {
    setAdapt(x => x);
  });

  it('should return a stream', function() {
    function main(_sources: {history: Stream<Location>}) {
      assert.strictEqual(typeof _sources.history.remember, 'function');
      return {
        history: xs.never(),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });
    assert.strictEqual(typeof sources.history.remember, 'function');
  });

  it('should create a location from pathname', done => {
    function main(_sources: {history: Stream<Location>}) {
      return {
        history: xs.of('/test'),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    sources.history.drop(1).subscribe({
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
    function main(_sources: {history: Stream<Location>}) {
      return {
        history: xs.of<PushHistoryInput>({type: 'push', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    sources.history.drop(1).subscribe({
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
    function main(_sources: {history: Stream<Location>}) {
      return {
        history: xs.of<ReplaceHistoryInput>({
          type: 'replace',
          pathname: '/test',
        }),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    sources.history.drop(1).subscribe({
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
    function main(_sources: {history: Stream<Location>}) {
      return {
        history: xs.of<HistoryInput | string>('/test', '/other', {
          type: 'go',
          amount: -1,
        }),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test'];

    sources.history.drop(1).subscribe({
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
    function main(_sources: {history: Stream<Location>}) {
      return {
        history: xs.of<HistoryInput | string>('/test', '/other', {
          type: 'goBack',
        }),
      };
    }

    const {sources, run} = setup(main, {
      history: makeServerHistoryDriver(),
    });

    const expected = ['/test', '/other', '/test'];

    sources.history.drop(1).subscribe({
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
    function main(_sources: {history: Stream<Location>}) {
      return {
        history: xs.of<HistoryInput | string>(
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

    sources.history.drop(1).subscribe({
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
    function main(_sources: {history: Stream<Location>}) {
      return {
        history: xs.of<HistoryInput | string>(
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

    sources.history.drop(1).subscribe({
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
