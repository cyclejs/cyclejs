import {EventsFnOptions} from './lib/DOMSource';
import {Observable} from 'rxjs';
export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): Observable<Element>;
  events(eventType: string, options?: EventsFnOptions): Observable<Event>;
}
