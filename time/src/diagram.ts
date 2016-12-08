
import xs, {Stream} from 'xstream';

function makeDiagram (scheduleEntry, currentTime, interval) {
  return function diagram (diagram: string): Stream<any> {
    const characters = diagram.split('');
    const stream = xs.create();

    characters.forEach((character, index) => {
      if (character === '-') {
        return;
      }

      const timeToSchedule = (index + 1) * interval;

      if (character === '|') {
        scheduleEntry({
          time: timeToSchedule,
          stream,
          type: 'complete'
        })
      } else if (character === '*') {
        scheduleEntry({
          time: timeToSchedule,
          stream,
          type: 'error',
          error: new Error(`scheduled error`)
        })
      } else {
        scheduleEntry({
          time: timeToSchedule,
          stream,
          type: 'next',
          value: character
        })
      }
    });

    return stream;
  }
}

export {
  makeDiagram
}
