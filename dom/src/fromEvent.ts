import {Stream, Producer, Listener} from 'xstream';

export type Predicate = (ev: any) => boolean;
export type PreventDefaultOpt = boolean | Predicate | Comparator;
export type Comparator = {[key: string]: any};

export function fromEvent(
  element: Element | Document,
  eventName: string,
  useCapture = false,
  preventDefault: PreventDefaultOpt = false,
): Stream<Event> {
  return Stream.create<Event>(
    {
      element: element,
      next: null,
      start: function start(listener: Listener<Event>) {
        if (preventDefault) {
          this.next = function next(event: Event) {
            preventDefaultConditional(event, preventDefault);
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

export function preventDefaultConditional(
  event: any,
  preventDefault: PreventDefaultOpt,
): void {
  if (preventDefault) {
    if (typeof preventDefault === 'boolean') {
      event.preventDefault();
    } else if (typeof preventDefault === 'function') {
      if (preventDefault(event)) {
        event.preventDefault();
      }
    } else if (typeof preventDefault === 'object') {
      const match: (m: any, o: any) => boolean = (matcher, obj) => {
        const isArray = Array.isArray(matcher);
        const array = isArray ? matcher : Object.keys(matcher);
        return array.reduce((acc: boolean, k: string, i: number) => {
          const idx = isArray ? i : k;
          const m = matcher[idx];
          const o = obj[idx];
          return (acc && (typeof m === 'object' && typeof o === 'object')) ||
          (Array.isArray(m) && Array.isArray(o))
            ? match(m, o)
            : m === o;
        }, true);
      };

      const matches = match(preventDefault, event);

      if (matches) {
        event.preventDefault();
      }
    } else {
      throw new Error(
        'preventDefault has to be either a boolean, predicate function or object',
      );
    }
  }
}
