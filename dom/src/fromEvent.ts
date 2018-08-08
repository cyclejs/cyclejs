import {Stream, Producer, Listener} from 'xstream';

export type Predicate = (ev: any) => boolean;
export type PreventDefaultOpt = boolean | Predicate | Comparator;
export type Comparator = {[key: string]: any};

export function fromEvent(
  element: Element | Document,
  eventName: string,
  useCapture = false,
  preventDefault: PreventDefaultOpt = false
): Stream<Event> {
  return Stream.create<Event>({
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
  } as Producer<Event>);
}

function matchObject(matcher: object, obj: object): boolean {
  const keys = Object.keys(matcher);
  const n = keys.length;
  for (let i = 0; i < n; i++) {
    const k = keys[i];
    if (typeof matcher[k] === 'object' && typeof obj[k] === 'object') {
      if (!matchObject(matcher[k], obj[k])) {
        return false;
      }
    } else if (matcher[k] !== obj[k]) {
      return false;
    }
  }
  return true;
}

export function preventDefaultConditional(
  event: any,
  preventDefault: PreventDefaultOpt
): void {
  if (preventDefault) {
    if (typeof preventDefault === 'boolean') {
      event.preventDefault();
    } else if (typeof preventDefault === 'function') {
      if (preventDefault(event)) {
        event.preventDefault();
      }
    } else if (typeof preventDefault === 'object') {
      if (matchObject(preventDefault, event)) {
        event.preventDefault();
      }
    } else {
      throw new Error(
        'preventDefault has to be either a boolean, predicate function or object'
      );
    }
  }
}
