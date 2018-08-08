import * as assert from 'assert';
import {timeDriver, TimeSource, Operator} from '../';
import xs, {Stream} from 'xstream';
import {setAdapt} from '@cycle/run/lib/adapt';

describe('time driver', () => {
  before(() => setAdapt(s => s));

  it('propagates events passed through operators', done => {
    const Time = timeDriver(xs.empty());

    const expected = [1, 2, 3];

    xs.of(1, 2, 3)
      .compose(Time.delay(1))
      .addListener({
        next(n: number) {
          assert.equal(n, expected.shift());
        },

        complete() {
          assert.equal(expected.length, 0);

          done();

          Time.dispose();
        },

        error: done,
      });
  });

  it('propagates errors', done => {
    const Time = timeDriver(xs.empty());

    xs.throw(new Error())
      .compose(Time.debounce(1))
      .addListener({
        error(err: Error) {
          done();
          Time.dispose();
        },
      });
  });
});
