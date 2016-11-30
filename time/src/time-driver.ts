import xs, {Stream} from 'xstream';
import * as assert from 'assert';
const makeAccumulator = require('sorted-immutable-list').default;

const addScheduleEntry = makeAccumulator({
  key: entry => entry.time,
  unique: false
})

function fill (array, value) {
  let i = 0;

  while (i < array.length) {
    array[i] = value;

    i++;
  }

  return array;
}

function diagramString (entries, interval): string {
  const maxTime = Math.max(...entries.map(entry => entry.time));

  const characterCount = Math.ceil(maxTime / interval);

  const diagram = fill(new Array(characterCount), '-');

  entries.forEach(entry => {
    const characterIndex = Math.floor(entry.time / interval);

    if (entry.type === 'next') {
      diagram[characterIndex] = entry.value;
    }

    if (entry.type == 'complete') {
      diagram[characterIndex] = '|';
    }
  });

  return diagram.join('');
}

function makeTimeDriver () {
  return function timeDriver () {
    const interval = 20;
    let time = 0;
    let schedule = [];

    return {
      diagram (diagram: string): Stream<any> {
        const characters = diagram.split('');
        const stream = xs.create();

        characters.forEach((character, index) => {
          if (character === '-') {
            return;
          }

          if (character === '|') {
            schedule = addScheduleEntry(
              schedule,
              {time: index * interval, stream, type: 'complete'}
            )

            return;
          }

          schedule = addScheduleEntry(
            schedule,
            {time: index * interval, stream, type: 'next', value: character}
          )
        });

        return stream;
      },

      delay (delayTime: number) {
        return function (stream: Stream<any>): Stream<any> {
          const newStream = xs.create();

          stream.addListener({
            next (event) {
              schedule = addScheduleEntry(
                schedule,
                {
                  time: time + delayTime,
                  value: event,
                  stream: newStream,
                  type: 'next'
                }
              )
            },
            complete () {
              schedule = addScheduleEntry(
                schedule,
                {
                  time: time,
                  stream: newStream,
                  type: 'complete'
                }
              )
            }
          })

          return newStream;
        }
      },

      assertEqual (a: Stream<any>, b: Stream<any>, done) {
        const aDiagram = [];
        const bDiagram = [];

        let calledComplete = 0;
        let completeStore = {};
        const complete = (label, diagram) => {
          calledComplete++;

          completeStore[label] = diagram;

          if (calledComplete === 2) {
            assert.equal(completeStore['a'], completeStore['b']);

            done();
          }
        }

        a.addListener({
          next (ev) {
            aDiagram.push({type: 'next', value: ev, time});
          },

          complete () {
            aDiagram.push({type: 'complete', time});

            complete('a', diagramString(aDiagram, interval))
          }
        })

        b.addListener({
          next (ev) {
            bDiagram.push({type: 'next', value: ev, time});
          },

          complete () {
            bDiagram.push({type: 'complete', time});

            complete('b', diagramString(bDiagram, interval))
          }
        })
      },

      run () {
        while (schedule.length > 0) {
          const eventToProcess = schedule.shift();
          time = eventToProcess.time;

          if (eventToProcess.type === 'next') {
            eventToProcess.stream.shamefullySendNext(eventToProcess.value);
          }

          if (eventToProcess.type === 'complete') {
            eventToProcess.stream.shamefullySendComplete();
          }
        }
      }
    }
  }
}

export default makeTimeDriver;
