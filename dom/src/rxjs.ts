import {EventsFnOptions} from './DOMSource';
import {makeDOMDriver as make, VNode} from './index';
import {Observable} from 'rxjs';
import {Stream} from 'xstream';
import {Driver} from '@cycle/run';

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

export const makeDOMDriver: () => Driver<
  Stream<VNode>,
  DOMSource
> = make as any;
