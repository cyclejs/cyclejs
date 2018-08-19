import {EventsFnOptions} from './lib/es6/DOMSource';
import {Observable} from 'rxjs';
export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): Observable<Element | Array<Element>>;
  events<K extends keyof HTMLElementEventMap>(
    eventType: K,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): Observable<HTMLElementEventMap[K]>;
  events(eventType: string, options?: EventsFnOptions): Observable<Event>;
}
