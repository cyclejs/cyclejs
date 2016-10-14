import {EventsFnOptions} from './lib/DOMSource';
import {Observable} from 'rx';
export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): Observable<Element | Array<Element>>;
  events(eventType: string, options?: EventsFnOptions): Observable<Event>;
}
