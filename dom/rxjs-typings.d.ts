import {EventsFnOptions} from './lib/DOMSource';
import {Observable} from 'rxjs';
export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): Observable<Element | Array<Element>>;
  events(eventType: string, options?: EventsFnOptions): Observable<Event>;
}
