// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {run} from '../src/index';
import * as most from 'most';

describe('run()', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof run, 'function');
  });

  it('should throw if first argument is not a function', function() {
    assert.throws(() => {
      (run as any)('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function() {
    assert.throws(() => {
      (run as any)(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function() {
    assert.throws(() => {
      run(() => ({}), {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return a dispose function', function() {
    const sandbox = sinon.sandbox.create();
    const spy = sandbox.spy();
    function app(sources: any) {
      return {
        other: sources.other.take(1).startWith('a'),
      };
    }
    function driver() {
      return most.of('b').tap(spy);
    }
    const dispose = run(app, {other: driver});
    assert.strictEqual(typeof dispose, 'function');
    setTimeout(() => {
      sinon.assert.calledOnce(spy);
    });
    dispose();
  });

  it('should report errors from main() in the console', function(done) {
    const sandbox = sinon.sandbox.create();
    sandbox.stub(console, 'error');

    function main(sources: any): any {
      return {
        other: sources.other.map(() => {
          throw new Error('malfunction');
        }),
      };
    }
    function driver(xsSink: any) {
      most
        .from(xsSink)
        .drain()
        .catch(() => {});
      return most.of('b');
    }

    let caught = false;
    try {
      run(main, {other: driver});
    } catch (err) {
      assert.strictEqual(err.message, 'malfunction');
      caught = true;
    }

    setTimeout(() => {
      sinon.assert.calledOnce(console.error as any);
      sinon.assert.calledWithExactly(
        console.error as any,
        sinon.match((err: any) => err.message === 'malfunction'),
      );

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      done();
    }, 100);
  });
});
