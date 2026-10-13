import {Stream} from 'xstream';
import {WindowSource} from './WindowSource';

export {
  Comparator,
  Predicate,
  PreventDefaultOpt,
  WindowEventOptions,
} from './fromEvent';
export {WindowSource} from './WindowSource';

export function makeWindowDriver(windowObject?: Window) {
  return function windowDriver(
    _sink$: Stream<any>,
    name: string = 'Window'
  ): WindowSource {
    const target =
      windowObject || (typeof window === 'undefined' ? undefined : window);

    if (!target) {
      throw new Error(
        'The window driver requires a browser Window or an explicitly injected Window'
      );
    }

    return new WindowSource(target, name);
  };
}
