import * as assert from 'assert';
import xs from 'xstream';
import {setAdapt} from '@cycle/run/lib/adapt';
import {makeWindowDriver} from '../../src';

interface FakeEvent extends Event {
  kind?: string;
}

class FakeWindow {
  public options: AddEventListenerOptions | boolean | undefined;
  private listeners: {[eventType: string]: Array<EventListener>} = {};

  public addEventListener(
    eventType: string,
    listener: EventListener,
    options?: AddEventListenerOptions | boolean
  ): void {
    this.options = options;
    this.listeners[eventType] = this.listeners[eventType] || [];
    this.listeners[eventType].push(listener);
  }

  public removeEventListener(eventType: string, listener: EventListener): void {
    const listeners = this.listeners[eventType] || [];
    this.listeners[eventType] = listeners.filter(item => item !== listener);
  }

  public dispatch(eventType: string, event: Event): void {
    const listeners = this.listeners[eventType] || [];
    listeners.slice().forEach(listener => listener(event));
  }

  public listenerCount(eventType: string): number {
    return (this.listeners[eventType] || []).length;
  }
}

function createEvent(kind?: string): FakeEvent {
  let prevented = false;
  return {
    kind,
    preventDefault() {
      prevented = true;
    },
    get defaultPrevented() {
      return prevented;
    },
  } as FakeEvent;
}

describe('window driver', () => {
  beforeEach(() => setAdapt(stream => stream));

  it('requires either a browser window or an injected window', () => {
    assert.throws(
      () => makeWindowDriver()(xs.never()),
      /requires a browser Window/
    );
  });

  it('forwards events and removes the listener on unsubscribe', done => {
    const target = new FakeWindow();
    const source = makeWindowDriver((target as any) as Window)(
      xs.never(),
      'Browser'
    );
    const received: Array<Event> = [];
    const stream = source.events('custom');
    const subscription = stream.subscribe({
      next: nextEvent => received.push(nextEvent),
      error: () => {},
      complete: () => {},
    });
    const event = createEvent();

    assert.strictEqual(target.listenerCount('custom'), 1);
    target.dispatch('custom', event);
    assert.deepStrictEqual(received, [event]);
    assert.strictEqual((stream as any)._isCycleSource, 'Browser');

    subscription.unsubscribe();
    target.dispatch('custom', createEvent());
    assert.strictEqual(received.length, 1);
    setTimeout(() => {
      assert.strictEqual(target.listenerCount('custom'), 0);
      done();
    });
  });

  it('passes capture and passive options to addEventListener', () => {
    const target = new FakeWindow();
    const source = makeWindowDriver((target as any) as Window)(xs.never());
    const subscription = source
      .events('custom', {useCapture: true, passive: true})
      .subscribe({next: () => {}, error: () => {}, complete: () => {}});

    assert.deepStrictEqual(target.options, {capture: true, passive: true});
    subscription.unsubscribe();
  });

  it('supports boolean and conditional preventDefault options', () => {
    const target = new FakeWindow();
    const source = makeWindowDriver((target as any) as Window)(xs.never());
    const always = source.events('always', {preventDefault: true}).subscribe({
      next: () => {},
      error: () => {},
      complete: () => {},
    });
    const conditional = source
      .events('conditional', {preventDefault: {kind: 'submit'}})
      .subscribe({next: () => {}, error: () => {}, complete: () => {}});
    const first = createEvent();
    const second = createEvent('other');
    const third = createEvent('submit');

    target.dispatch('always', first);
    target.dispatch('conditional', second);
    target.dispatch('conditional', third);

    assert.strictEqual(first.defaultPrevented, true);
    assert.strictEqual(second.defaultPrevented, false);
    assert.strictEqual(third.defaultPrevented, true);
    always.unsubscribe();
    conditional.unsubscribe();
  });

  it('rejects preventDefault on passive listeners', () => {
    const target = new FakeWindow();
    const source = makeWindowDriver((target as any) as Window)(xs.never());

    assert.throws(
      () =>
        source.events('custom', {
          passive: true,
          preventDefault: true,
        }),
      /passive window event listener/
    );
  });
});
