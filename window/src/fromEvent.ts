import {Listener, Producer, Stream} from 'xstream';

export type Predicate = (event: Event) => boolean;
export type Comparator = {[key: string]: any};
export type PreventDefaultOpt = boolean | Predicate | Comparator;

export interface WindowEventOptions {
  useCapture?: boolean;
  passive?: boolean;
  preventDefault?: PreventDefaultOpt;
}

export function fromEvent(
  target: Window,
  eventType: string,
  options: WindowEventOptions = {}
): Stream<Event> {
  const useCapture = options.useCapture || false;
  const passive = options.passive || false;
  const preventDefault = options.preventDefault || false;

  if (passive && preventDefault) {
    throw new Error(
      'Cannot prevent default behavior from a passive window event listener'
    );
  }

  let handler: ((event: Event) => void) | null = null;

  return Stream.create<Event>({
    start(listener: Listener<Event>) {
      handler = (event: Event) => {
        preventDefaultConditional(event, preventDefault);
        listener.next(event);
      };
      target.addEventListener(eventType, handler, {
        capture: useCapture,
        passive,
      });
    },
    stop() {
      target.removeEventListener(
        eventType,
        handler as EventListener,
        useCapture
      );
      handler = null;
    },
  } as Producer<Event>);
}

export function preventDefaultConditional(
  event: Event,
  preventDefault: PreventDefaultOpt
): void {
  if (!preventDefault) {
    return;
  }

  if (typeof preventDefault === 'boolean') {
    event.preventDefault();
  } else if (typeof preventDefault === 'function') {
    if ((preventDefault as Predicate)(event)) {
      event.preventDefault();
    }
  } else if (typeof preventDefault === 'object') {
    if (matchObject(preventDefault, event)) {
      event.preventDefault();
    }
  } else {
    throw new Error(
      'preventDefault must be a boolean, predicate function, or object'
    );
  }
}

function matchObject(matcher: object, value: object): boolean {
  const keys = Object.keys(matcher);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const expected = matcher[key];
    const actual = value[key];
    if (
      typeof expected === 'object' &&
      expected !== null &&
      typeof actual === 'object' &&
      actual !== null
    ) {
      if (!matchObject(expected, actual)) {
        return false;
      }
    } else if (expected !== actual) {
      return false;
    }
  }
  return true;
}
