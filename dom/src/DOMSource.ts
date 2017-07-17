import {Stream, MemoryStream} from 'xstream';
export interface EventsFnOptions {
  useCapture?: boolean;
  preventDefault?: boolean;
}

export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): MemoryStream<Document | Element | Array<Element> | string>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
