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
    const characterIndex = Math.floor(entry.time / interval) - 1;

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

    function scheduleEntry (newEntry) {
      schedule = addScheduleEntry(schedule, newEntry)

      return newEntry;
    }

    return {
      diagram (diagram: string): Stream<any> {
        const characters = diagram.split('');
        const stream = xs.create();

        characters.forEach((character, index) => {
          if (character === '-') {
            return;
          }

          const timeToSchedule = (index + 1) * interval;

          if (character === '|') {
            scheduleEntry(
              {time: timeToSchedule, stream, type: 'complete'}
            )

            return;
          }

          scheduleEntry(
            {time: timeToSchedule, stream, type: 'next', value: character}
          )
        });

        return stream;
      },

      delay (delayTime: number) {
        return function (stream: Stream<any>): Stream<any> {
          const newStream = xs.create();

          stream.addListener({
            next (event) {
              scheduleEntry(
                {
                  time: time + delayTime,
                  value: event,
                  stream: newStream,
                  type: 'next'
                }
              )
            },

            complete () {
              scheduleEntry(
                {
                  time: time + delayTime,
                  stream: newStream,
                  type: 'complete'
                }
              )
            }
          })

          return newStream;
        }
      },

      debounce (debounceInterval: number) {
        return function _debounce (stream: Stream<any>): Stream<any> {
          const outStream = xs.create();
          let scheduledEntry = null;

          stream.addListener({
            next (ev) {
              if (scheduledEntry) {
                const timeToSchedule = time + debounceInterval;

                const timeAfterPrevious = timeToSchedule - scheduledEntry.time;

                if (timeAfterPrevious <= debounceInterval) {
                  scheduledEntry.cancelled = true;
                }
              }

              scheduledEntry = scheduleEntry({
                type: 'next',
                value: ev,
                time: time + debounceInterval,
                stream: outStream
              });
            },

            complete () {
              scheduleEntry({
                type: 'complete',
                time,
                stream: outStream
              })
            }
          });

          return outStream;
        }
      },

      interval (timeInterval: number): Stream<any> {
        let stopped = false;

        function scheduleNextEvent (entry, time) {
          if (stopped) {
            return;
          }

          scheduleEntry({
            time: time + timeInterval,
            value: entry.value + 1,
            stream: entry.stream,
            f: scheduleNextEvent,
            type: 'next'
          })
        }


        const producer = {
          start (listener) {
            scheduleEntry(
              {
                time: time + timeInterval,
                value: 0,
                stream: listener,
                type: 'next',
                f: scheduleNextEvent
              }
            )
          },

          stop () {
            stopped = true;
          }
        }

        const stream = xs.create(producer);

        return stream;
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
            const equal = completeStore['a'] === completeStore['b'];

            if (equal) {
              done();
            } else {
              done(new Error(`
Expected

${completeStore['b']}

Got

${completeStore['a']}
              `));
            }
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
        function processEvent () {
          const eventToProcess = schedule.shift();

          if (!eventToProcess) {
            return;
          }

          if (eventToProcess.cancelled) {
            setTimeout(processEvent, 1);
            return;
          }

          time = eventToProcess.time;

          if (eventToProcess.f) {
            eventToProcess.f(eventToProcess, time);
          }

          if (eventToProcess.type === 'next') {
            eventToProcess.stream.shamefullySendNext(eventToProcess.value);
          }

          if (eventToProcess.type === 'complete') {
            eventToProcess.stream.shamefullySendComplete();
          }

          setTimeout(processEvent, 1);
        }

        setTimeout(processEvent, 1);
      }
    }
  }
}

export default makeTimeDriver;
