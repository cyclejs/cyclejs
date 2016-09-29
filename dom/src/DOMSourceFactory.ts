import {DOMSource} from './DOMSource';
import {DOMSourceOptions} from './DOMSourceOptions';
import {MainDOMSource, MainDOMSourceOptions} from './MainDOMSource';
import {BodyDOMSource} from './BodyDOMSource';
import {DocumentDOMSource} from './DocumentDOMSource';

export class DOMSourceFactory {
  static create(type: string, options: DOMSourceOptions): DOMSource {
    // Ordered most common on top for optimisation.
    // We use if-statements instead of switch, because few conditionals
    // optimise better with if-statements.
    if (type !== 'document' && type !== 'body') {
      return new MainDOMSource(<MainDOMSourceOptions>options);
    }
    if (type === 'body') {
      return new BodyDOMSource(options);
    }
    if (type === `document`) {
      return new DocumentDOMSource(options);
    }
  }
}
