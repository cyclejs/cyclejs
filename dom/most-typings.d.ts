import {EventsFnOptions} from './lib/es6/DOMSource';
import {Stream} from 'most';
export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): Stream<Element | Array<Element>>;
  events<K extends keyof HTMLElementEventMap>(
    eventType: K,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): Stream<HTMLElementEventMap[K]>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
