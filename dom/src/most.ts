import {EventsFnOptions} from './DOMSource';
import {makeDOMDriver as make, VNode, DOMDriverOptions} from './index';
import {Stream} from 'most';
import {Stream as xsStream} from 'xstream';
import {Driver} from '@cycle/run';

export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): Stream<Array<Element>>;
  element(): Stream<Element>;
  events<K extends keyof HTMLElementEventMap>(
    eventType: K,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): Stream<HTMLElementEventMap[K]>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}

export const makeDOMDriver: (
  sel: string | Element | DocumentFragment,
  opts?: DOMDriverOptions
) => Driver<xsStream<VNode>, DOMSource> = make as any;
