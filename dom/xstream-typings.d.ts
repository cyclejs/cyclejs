import {EventsFnOptions} from './lib/DOMSource';
import {Stream, MemoryStream} from 'xstream';
export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): MemoryStream<Element>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
