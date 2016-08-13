import {Stream, Producer, Listener} from 'xstream';

export function fromEvent(element: Element | Document,
                          eventName: string,
                          useCapture = false): Stream<Event> {
  return Stream.create<Event>(<Producer<Event>> {
    element: element,
    next: null,
    start: function start(listener: Listener<Event>) {
      this.next = function next(event: Event) { listener.next(event); };
      this.element.addEventListener(eventName, this.next, useCapture);
    },
    stop: function stop() {
      this.element.removeEventListener(eventName, this.next, useCapture);
    }
  });
}
