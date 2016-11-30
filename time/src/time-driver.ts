import xs, {Stream} from 'xstream';
import * as assert from 'assert';
const makeAccumulator = require('sorted-immutable-list').default;
const requestAnimationFrame = require('raf');

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

function makeTimeDriver ({interval = 20} = {}) {
  return function timeDriver () {
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
            scheduleEntry({
              time: timeToSchedule,
              stream,
              type: 'complete'
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
      },

      delay (delayTime: number) {
        return function (stream: Stream<any>): Stream<any> {
          const outStream = xs.create();

          stream.addListener({
            next (event) {
              scheduleEntry({
                time: time + delayTime,
                value: event,
                stream: outStream,
                type: 'next'
              })
            },

            complete () {
              scheduleEntry({
                time: time + delayTime,
                stream: outStream,
                type: 'complete'
              })
            }
          })

          return outStream;
        }
      },

      debounce (debounceInterval: number) {
        return function debounceOperator (stream: Stream<any>): Stream<any> {
          const outStream = xs.create();
          let scheduledEntry = null;

          stream.addListener({
            next (ev) {
              const timeToSchedule = time + debounceInterval;

              if (scheduledEntry) {
                const timeAfterPrevious = timeToSchedule - scheduledEntry.time;

                if (timeAfterPrevious <= debounceInterval) {
                  scheduledEntry.cancelled = true;
                }
              }

              scheduledEntry = scheduleEntry({
                type: 'next',
                value: ev,
                time: timeToSchedule,
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
            scheduleEntry({
              time: time + timeInterval,
              value: 0,
              stream: listener,
              type: 'next',
              f: scheduleNextEvent
            })
          },

          stop () {
            stopped = true;
          }
        }

        return xs.create(producer);
      },

      throttle (period: number) {
        return function throttleOperator (stream: Stream<any>): Stream<any> {
          const outStream = xs.create();
          let lastEventTime = -Infinity; // so that the first event is always scheduled

          stream.addListener({
            next (event) {
              const timeSinceLastEvent = time - lastEventTime;

              if (timeSinceLastEvent > period) {
                scheduleEntry({
                  time: time,
                  value: event,
                  stream: outStream,
                  type: 'next'
                })
              }

              lastEventTime = time;
            },

            complete () {
              scheduleEntry({
                time: time,
                stream: outStream,
                type: 'complete'
              })
            }
          })

          return outStream;
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
            setTimeout(processEvent, 0);
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

          setTimeout(processEvent, 0);
        }

        setTimeout(processEvent, 0);
      },

      runRealtime () {
        function processEvent (eventTime) {
          time = eventTime;

          if (schedule.length === 0) {
            requestAnimationFrame(processEvent);

            return;
          }

          let nextEventTime = schedule[0].time;

          while (nextEventTime < time) {
            const eventToProcess = schedule.shift();

            if (!eventToProcess.cancelled) {
              if (eventToProcess.f) {
                eventToProcess.f(eventToProcess, time);
              }

              if (eventToProcess.type === 'next') {
                eventToProcess.stream.shamefullySendNext(eventToProcess.value);
              }

              if (eventToProcess.type === 'complete') {
                eventToProcess.stream.shamefullySendComplete();
              }

              nextEventTime = (schedule[0] && schedule[0].time) || Infinity;
            }
          }

          requestAnimationFrame(processEvent);
        }

        requestAnimationFrame(processEvent);
      }
    }
  }
}

export default makeTimeDriver;
