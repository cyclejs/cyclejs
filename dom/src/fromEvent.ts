import {Stream, Producer, Listener} from 'xstream';

export function fromEvent(
  element: Element | Document,
  eventName: string,
  useCapture = false,
  preventDefault = false,
): Stream<Event> {
  return Stream.create<Event>(
    {
      element: element,
      next: null,
      start: function start(listener: Listener<Event>) {
        if (preventDefault) {
          this.next = function next(event: Event) {
            event.preventDefault();
            listener.next(event);
          };
        } else {
          this.next = function next(event: Event) {
            listener.next(event);
          };
        }

        this.element.addEventListener(eventName, this.next, useCapture);
      },
      stop: function stop() {
        this.element.removeEventListener(eventName, this.next, useCapture);
      },
    } as Producer<Event>,
  );
}
