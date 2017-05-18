import xs, {Stream} from 'xstream';
import {DOMSource} from '@cycle/dom';
import {ZapSpeed} from './model';

export default function intent(domSource: DOMSource): Stream<ZapSpeed> {
  return xs.merge(
    domSource.select('.slowSpeedButton').events('click').mapTo('slow' as ZapSpeed),
    domSource.select('.normalSpeedButton').events('click').mapTo('normal' as ZapSpeed),
    domSource.select('.fastSpeedButton').events('click').mapTo('fast' as ZapSpeed),
  );
}
