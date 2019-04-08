import {newDefaultScheduler} from '@most/scheduler';
import {until, runEffects, tap} from '@most/core';
import {Stream as MostStream} from '@most/types';
import {createAdapter} from '@most/adapter';
import {Stream, Listener, Producer} from 'xstream';
import xs from 'xstream';

export function toProducer(stream: MostStream<any>): Producer<any> {
  const [induce, events] = createAdapter();
  const producer = {
    stop: function() {
      induce('');
    },
    start: function(listener: Listener<any>) {
      function log(x: any) {
        //listener can't leave scope
        listener.next(x);
      }
      const tapped = tap(log, stream);
      until(events, runEffects(tapped, newDefaultScheduler()) as any);
    },
  };
  return producer;
}

export function toXstream<k>(stream: MostStream<k>): Stream<k> {
  return xs.create(toProducer(stream));
}
