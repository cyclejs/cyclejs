import {EventsFnOptions} from './lib/DOMSource';
import {Stream} from 'most';
export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): Stream<Element | Array<Element>>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}
