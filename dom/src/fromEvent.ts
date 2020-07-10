import {Stream, Producer, Listener} from 'xstream';

export type Predicate = (ev: any) => boolean;
export type PreventDefaultOpt = boolean | Predicate | Comparator;
export type Comparator = {[key: string]: any};

export function fromEvent(
  element: Element | Document,
  eventName: string,
  useCapture = false,
  preventDefault: PreventDefaultOpt = false,
  passive = false
): Stream<Event> {
  let next: ((e: Event) => void) | null = null;
  return Stream.create<Event>({
    start: function start(listener: Listener<Event>) {
      if (preventDefault) {
        next = function _next(event: Event) {
          preventDefaultConditional(event, preventDefault);
          listener.next(event);
        };
      } else {
        next = function _next(event: Event) {
          listener.next(event);
        };
      }
      element.addEventListener(eventName, next, {
        capture: useCapture,
        passive,
      });
    },
    stop: function stop() {
      element.removeEventListener(eventName, next as any, useCapture);
      next = null;
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
    } else if (isPredicate(preventDefault)) {
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

function isPredicate(fn: any): fn is Predicate {
  return typeof fn === 'function';
}
