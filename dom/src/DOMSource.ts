import {Stream, MemoryStream} from 'xstream';
export type Predicate = (e : any) => boolean;
export interface EventsFnOptions {
  useCapture?: boolean;
  preventDefault?: boolean | Predicate;
}

export interface DOMSource {
  select<S extends DOMSource>(selector: string): S;
  elements(): MemoryStream<Document | Element | Array<Element> | string>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
