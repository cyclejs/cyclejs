import {Stream, MemoryStream} from 'xstream';
import {PreventDefaultOpt} from './fromEvent';
export interface EventsFnOptions {
  useCapture?: boolean;
  preventDefault?: PreventDefaultOpt;
}

export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): MemoryStream<
    Array<Document> | Array<HTMLBodyElement> | Array<Element> | string
  >;
  element(): MemoryStream<Document | HTMLBodyElement | Element>;
  events<K extends keyof HTMLElementEventMap>(
    eventType: K,
    options?: EventsFnOptions,
  ): Stream<HTMLElementEventMap[K]>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
