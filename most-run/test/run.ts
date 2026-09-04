// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {run, setup} from '../src/index';
import {map, startWith, take} from '@most/core';
import xs, {Stream as xsStream} from 'xstream';

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

  it('should return a dispose function', function(done) {
    const sandbox = sinon.createSandbox();
    const spy = sandbox.spy();
    function app(sources: any) {
      return {
        other: startWith('a', take(1, sources.other)),
      };
    }
    function driver(_sink: xsStream<string>) {
      return xs.of('b').map(value => {
        spy(value);
        return value;
      });
    }
    const dispose = run(app, {other: driver});
    assert.strictEqual(typeof dispose, 'function');
    setTimeout(() => {
      sinon.assert.calledOnce(spy);
      dispose();
      done();
    }, 10);
  });

  it('should dispose xstream driver sources', function(done) {
    const start = sinon.spy();
    const stop = sinon.spy();
    const source = xs.create<string>({
      start,
      stop,
    });
    const dispose = run((sources: any) => ({other: sources.other}), {
      other: () => source,
    });

    setTimeout(() => {
      sinon.assert.calledOnce(start);
      dispose();
      setTimeout(() => {
        sinon.assert.calledOnce(stop);
        done();
      }, 20);
    }, 10);
  });

  it('should report errors from main() in the console', function(done) {
    const sandbox = sinon.createSandbox();
    sandbox.stub(console, 'error');

    function main(sources: any): any {
      return {
        other: map(() => {
          throw new Error('malfunction');
        }, sources.other),
      };
    }
    function driver(sink: xsStream<any>) {
      sink.addListener({error: () => {}});
      return xs.of('b');
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
        sinon.match((err: any) => err.message === 'malfunction')
      );

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      done();
    }, 100);
  });
});
