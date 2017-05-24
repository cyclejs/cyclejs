import {Stream, MemoryStream} from 'xstream';
import {PreventDefaultOpt} from './fromEvent';
export interface EventsFnOptions {
  useCapture?: boolean;
  preventDefault?: PreventDefaultOpt;
}

export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): MemoryStream<Document | Element | Array<Element> | string>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
