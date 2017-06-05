import {adapt} from '@cycle/run/lib/adapt';
import xs, {Stream} from 'xstream';

function parseIntIfDecimal(str: string): number | string {
  if (str.match(/[0-9]/)) {
    return parseInt(str, 10);
  }
  return str;
}

function makeDiagram(
  schedule: any,
  currentTime: () => number,
  interval: number,
  setMaxTime: any,
) {
  return function diagram(diagramString: string, values = {}): Stream<any> {
    const characters = diagramString.split('');
    const stream = xs.create();
    function valueFor(character: string) {
      if (character in values) {
        return values[character];
      }
      return parseIntIfDecimal(character);
    }

    setMaxTime(diagramString.length * interval);

    let multipleValueFrame: false | number = false;

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
        timeToSchedule = multipleValueFrame;
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
  };
}

export {makeDiagram};
