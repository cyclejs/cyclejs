
import * as assert from 'assert';
import {timeDriver, TimeSource, Operator} from '../';
import xs, {Stream} from 'xstream';
import {setAdapt} from '@cycle/run/lib/adapt';

describe('time driver', () => {
  before(() => setAdapt(s => s));

  it('propagates errors', (done) => {
    const Time = timeDriver(xs.empty());

    xs.throw(new Error()).compose(Time.debounce(1)).addListener({
      error (err: Error) {
        done();
        Time.dispose();
      }
    })
  });
});
