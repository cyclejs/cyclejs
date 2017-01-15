
import xs, {Stream} from 'xstream';

const parseIntIfDecimal = (str) => {
  if (str.match(/[0-9]/)) {
    return parseInt(str, 10);
  }

  return str;
}

function makeDiagram (schedule, currentTime, interval) {
  return function diagram (diagram: string, values = {}): Stream<any> {
    const characters = diagram.split('');
    const stream = xs.create();
    const valueFor = (character) => values[character] || parseIntIfDecimal(character);

    characters.forEach((character, index) => {
      if (character === '-') {
        return;
      }

      const timeToSchedule = index * interval;

      if (character === '|') {
        schedule.completion(stream, timeToSchedule);
      } else if (character === '#') {
        schedule.error(stream, timeToSchedule, new Error(`scheduled error`));
      } else {
        schedule.next(stream, timeToSchedule, valueFor(character));
      }
    });

    return stream;
  }
}

export {
  makeDiagram
}
