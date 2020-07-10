import {MemoryStream, Stream} from 'xstream';
import {PreventDefaultOpt} from './fromEvent';
import {MainDOMSource} from './MainDOMSource';
import {DocumentDOMSource} from './DocumentDOMSource';
import {BodyDOMSource} from './BodyDOMSource';

export interface EventsFnOptions {
  useCapture?: boolean;
  passive?: boolean;
  bubbles?: boolean;
  preventDefault?: PreventDefaultOpt;
}

// There is no MockedDOMSource as its functions return any,
// which would overshadow the other members, making this union pointless
export type DOMSource = MainDOMSource | DocumentDOMSource | BodyDOMSource;
