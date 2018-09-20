import {EventsFnOptions} from './DOMSource';
import {makeDOMDriver as make, VNode} from './index';
import {Stream} from 'most';
import xs from 'xstream';
import {Driver} from '@cycle/run';

export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): Stream<Element | Array<Element>>;
  events<K extends keyof HTMLElementEventMap>(
    eventType: K,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): Stream<HTMLElementEventMap[K]>;
  events(
    eventType: string,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): Stream<Event>;
}

export const makeDOMDriver: () => Driver<xs<VNode>, DOMSource> = make as any;
