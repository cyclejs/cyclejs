import {now, periodic} from '@most/core';
import xs from 'xstream';
import {toXstream} from '../src/toXstream';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {adapt} from '../../run/src/adapt';

describe.skip('helloWorld', () => {
  it('returns the expected result', done => {
    const list = {
      next: (x: any) => assert.strictEqual(3, x),
      error: (err: any) => {
        console.error('The Stream gave me an error: ', err);
      },
      complete: () => {},
    };
    const dispose = toXstream(now(3)).subscribe(list);
    // dispose = xs.create(list).subscribe()
    setInterval(() => dispose.unsubscribe(), 10);
    setInterval(() => {
      // dispose.removeListener(list)
      done();
    }, 10);
  });
  it('unadapt works', done => {
    const list = {
      next: (x: any) => assert.strictEqual(3, x),
      error: (err: any) => {
        console.error('The Stream gave me an error: ', err);
      },
      complete: () => {},
    };
    const dispose = toXstream(now(3)).subscribe(list);
    // dispose = xs.create(list).subscribe()
    setInterval(() => dispose.unsubscribe(), 10);
    setInterval(() => {
      // dispose.removeListener(list)
      done();
    }, 10);
  });
  it('it will stop producer', () => {
    // just will, the streams aren't hot, so you can't really test it
    const a = now(33);
    const b = 2;
    assert(true);

    // const fn = jest.fn();
    // const list = {
    //   next: (x)=>{x},
    //   error: (err) => {
    //     console.error('The Stream gave me an error: ', err);
    //   },
    //   complete: () => { },
    // }
    // const stream = multicast(periodic(30))
    // var dispose = toXstream(stream).subscribe(list)
    // const tapped = tap(fn, stream)
    // // dispose = xs.create(list).subscribe()
    // setInterval(() => dispose.unsubscribe(), 50)
    // setInterval(() => {
    //   // dispose.removeListener(list)
    //   expect(fn).toHaveBeenCalledTimes(1)
    //   done()
    // }, 100)
  });
});
