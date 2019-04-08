// tslint:disable-next-line
// import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {run, setup} from '../src/index';
import * as most from 'most';
import {now, tap, startWith, runEffects} from '@most/core';
import {newDefaultScheduler} from '@most/scheduler';
import {create} from '@most/create';
import xs, {Stream} from 'xstream';
import {toXstream} from '../src/toXstream';
import {adapt, setAdapt, setUnadapt, unadapt} from '../../run/src/adapt';
import {Stream as MostStream} from 'most';

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
    const sandbox = sinon.createSandbox();
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
    const sandbox = sinon.createSandbox();
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
        sinon.match((err: any) => err.message === 'malfunction')
      );

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      done();
    }, 100);
  });
  it('create supports mostjs core', function(done) {
    const sandbox = sinon.createSandbox();
    const spy = sandbox.spy();
    const asdf$ = create(add => {
      setTimeout(add, 100, 'event 1');
    }) as any;

    const spying = tap(spy, asdf$);
    runEffects(spying, newDefaultScheduler());

    setTimeout(() => {
      sinon.assert.calledOnce(spy);
      done();
    }, 150);
  });
  it('unadapt works', function() {
    const asdf$ = unadapt(now(3)).subscribe({
      next: (x: any) => assert.strictEqual(3, x),
    });
    setTimeout(() => {
      // done();
    }, 150);
  });
  it('adapt works', function(done) {
    const sub = tap(x => {
      assert.strictEqual(x, 3);
    }, adapt(xs.of(3)));
    runEffects(sub, newDefaultScheduler());
    done();
  });
  it('mostjs app', function(done) {
    console.log(34);
    const sandbox = sinon.createSandbox();
    const spy = sandbox.spy();
    function app(sources: any) {
      const other$ = sources.other;
      const spy$ = tap(spy, other$);
      return {};
    }
    function driver(asd: any) {
      const now$ = now('b');
      runEffects(now$, newDefaultScheduler());
      return now$;
    }
    const dispose = run(app, {other: driver});
    setTimeout(() => {
      sinon.assert.calledWith(spy, 'b');
      done();
    }, 50);
    dispose();
  });
  it.only('mostjs drivers', function(done) {
    console.log(34);
    const sandbox = sinon.createSandbox();
    const spy = sandbox.spy();
    const mainSpy = sandbox.spy();
    function app(sources: any) {
      const other$ = sources.other;
      const spy$ = tap(mainSpy, other$);
      const sink$ = now('a');
      return {
        other: sink$,
      };
    }
    function driver(asd: any) {
      const now$ = now('b');
      const converted = adapt(asd);
      const b = tap(spy, converted);
      const d = tap(x => console.log(1, x), converted);
      runEffects(b, newDefaultScheduler());
      runEffects(d, newDefaultScheduler());
      runEffects(now$, newDefaultScheduler());
      return now$;
    }
    const dispose = run(app, {other: driver});
    setTimeout(() => {
      sinon.assert.calledWith(spy, 'a');
      // sinon.assert.calledWith(mainSpy, 'b');
      done();
    }, 50);
    dispose();
  });
});
