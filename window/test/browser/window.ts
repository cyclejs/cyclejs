import * as assert from 'assert';
import xs from 'xstream';
import {setAdapt} from '@cycle/run/lib/adapt';
import {makeWindowDriver} from '../../src';

describe('window driver in a browser', () => {
  beforeEach(() => setAdapt(stream => stream));

  it('emits actual window events', done => {
    const source = makeWindowDriver()(xs.never(), 'Window');
    const subscription = source.events('resize').subscribe({
      next: event => {
        assert.strictEqual(event.type, 'resize');
        subscription.unsubscribe();
        done();
      },
      error: done,
      complete: () => done(new Error('the event stream should not complete')),
    });

    window.dispatchEvent(new Event('resize'));
  });

  it('prevents default behavior when requested', done => {
    const source = makeWindowDriver()(xs.never());
    const event = new CustomEvent('window-test', {
      cancelable: true,
      detail: {submit: true},
    });
    const subscription = source
      .events('window-test', {
        preventDefault: candidate =>
          (candidate as CustomEvent).detail.submit === true,
      })
      .subscribe({
        next: received => {
          assert.strictEqual(received, event);
          assert.strictEqual(received.defaultPrevented, true);
          subscription.unsubscribe();
          done();
        },
        error: done,
        complete: () => done(new Error('the event stream should not complete')),
      });

    window.dispatchEvent(event);
  });

  it('stops emitting after unsubscription', () => {
    const source = makeWindowDriver()(xs.never());
    let eventCount = 0;
    const subscription = source.events('window-cleanup').subscribe({
      next: () => eventCount++,
      error: () => {},
      complete: () => {},
    });

    window.dispatchEvent(new Event('window-cleanup'));
    subscription.unsubscribe();
    window.dispatchEvent(new Event('window-cleanup'));

    assert.strictEqual(eventCount, 1);
  });
});
