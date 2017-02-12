import {adapt} from '@cycle/run/lib/adapt';
import xs, {Stream} from 'xstream';

const parseIntIfDecimal = (str) => {
  if (str.match(/[0-9]/)) {
    return parseInt(str, 10);
  }

  return str;
}

function makeDiagram (schedule, currentTime, interval, setMaxTime) {
  return function diagram (diagramString: string, values = {}): Stream<any> {
    const characters = diagramString.split('');
    const stream = xs.create();
    const valueFor = (character) => values[character] || parseIntIfDecimal(character);

    setMaxTime(diagramString.length * interval);

    let multipleValueFrame : boolean | number = false;

    characters.forEach((character, index) => {
      if (character === '-') {
        return;
      }

      let timeToSchedule = index * interval;

      if (character === '(') {
        multipleValueFrame = timeToSchedule;
        return;
      }

      if (character === ')') {
        multipleValueFrame = false;
        return;
      }

      if (multipleValueFrame !== false) {
        timeToSchedule = multipleValueFrame as number;
      }

      if (character === '|') {
        schedule.completion(stream, timeToSchedule);
      } else if (character === '#') {
        schedule.error(stream, timeToSchedule, new Error(`scheduled error`));
      } else {
        schedule.next(stream, timeToSchedule, valueFor(character));
      }
    });

    return adapt(stream);
  }
}

export {
  makeDiagram
}
