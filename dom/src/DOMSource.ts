import {Stream, MemoryStream} from 'xstream';
import {PreventDefaultOpt} from './fromEvent';
export interface EventsFnOptions {
  useCapture?: boolean;
  preventDefault?: PreventDefaultOpt;
}

export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): MemoryStream<
    Document | HTMLBodyElement | Array<Element> | string
  >;
  events<K extends keyof HTMLElementEventMap>(
    eventType: K,
    options?: EventsFnOptions,
  ): Stream<HTMLElementEventMap[K]>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
