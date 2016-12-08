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
    const characterIndex = Math.max(0, Math.floor(entry.time / interval) - 1);

    if (entry.type === 'next') {
      diagram[characterIndex] = entry.value;
    }

    if (entry.type == 'complete') {
      diagram[characterIndex] = '|';
    }

    if (entry.type === 'error') {
      diagram[characterIndex] = '*';
    }
  });

  if (entries.length > 1) {
    const completeEntry = entries[entries.length - 1];
    const lastEntry = entries[entries.length - 2];

    if (completeEntry.type === 'complete' && lastEntry.time === completeEntry.time) {
      diagram[diagram.length - 1] = lastEntry.value;
      diagram.push('|');
    }
  }

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

            error (error) {
              scheduleEntry({
                time: time + delayTime,
                error,
                stream: outStream,
                type: 'error'
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

            error (error) {
              scheduleEntry({
                type: 'error',
                time,
                error,
                stream: outStream
              })
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

      periodic (period: number): Stream<any> {
        let stopped = false;

        function scheduleNextEvent (entry, time) {
          if (stopped) {
            return;
          }

          scheduleEntry({
            time: time + period,
            value: entry.value + 1,
            stream: entry.stream,
            f: scheduleNextEvent,
            type: 'next'
          })
        }

        let _listener;

        const producer = {
          start (listener) {
            _listener = listener;

            scheduleEntry({
              time: time + period,
              value: 0,
              stream: listener,
              type: 'next',
              f: scheduleNextEvent
            })
          },

          stop () {
            stopped = true;

            scheduleEntry({
              time: time,
              stream: _listener,
              type: 'complete'
            })
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
              const throttleEvent = timeSinceLastEvent <= period;

              if (throttleEvent) {
                return;
              }

              scheduleEntry({
                time: time,
                value: event,
                stream: outStream,
                type: 'next'
              })

              lastEventTime = time;
            },

            error (error) {
              scheduleEntry({
                time: time,
                stream: outStream,
                error,
                type: 'error'
              })
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

      assertEqual (actual: Stream<any>, expected: Stream<any>, done) {
        let calledComplete = 0;
        let completeStore = {};

        function complete (label, diagram) {
          calledComplete++;

          completeStore[label] = diagram;

          if (calledComplete === 2) {
            const equal = completeStore['actual'] === completeStore['expected'];

            if (equal) {
              done();
            } else {
              done(new Error(`
                Expected

                ${completeStore['expected']}

                Got

                ${completeStore['actual']}
              `.replace(/^\s{6}/, '')));
            }
          }
        }

        const completeListener = (label) => {
          const entries = [];

          return {
            next (ev) {
              entries.push({type: 'next', value: ev, time});
            },

            complete () {
              entries.push({type: 'complete', time});

              complete(label, diagramString(entries, interval))
            },

            error (error) {
              entries.push({type: 'error', time, error});

              complete(label, diagramString(entries, interval));
            }
          }
        }

        actual.addListener(completeListener('actual'))
        expected.addListener(completeListener('expected'))
      },

      run () {
        function processEvent () {
          const eventToProcess = schedule.shift();

          if (!eventToProcess) {
            return;
          }

          if (eventToProcess.cancelled) {
            setTimeout(processEvent);
            return;
          }

          time = eventToProcess.time;

          if (eventToProcess.f) {
            eventToProcess.f(eventToProcess, time);
          }

          if (eventToProcess.type === 'next') {
            eventToProcess.stream.shamefullySendNext(eventToProcess.value);
          }

          if (eventToProcess.type === 'error') {
            eventToProcess.stream.shamefullySendError(eventToProcess.error);
          }

          if (eventToProcess.type === 'complete') {
            eventToProcess.stream.shamefullySendComplete();
          }

          setTimeout(processEvent);
        }

        setTimeout(processEvent);
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

const mockTimeSource = makeTimeDriver();

export {
  makeTimeDriver,

  mockTimeSource
}
