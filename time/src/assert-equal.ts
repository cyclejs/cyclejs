import xs, {Stream} from 'xstream';
import * as deepEqual from 'deep-equal';

function makeAssertEqual (scheduleEntry, currentTime, interval, addAssert) {
  return function assertEqual (actual: Stream<any>, expected: Stream<any>) {
    let calledComplete = 0;
    let completeStore = {};

    const assert = {
      state: 'pending',
      error: null,
      unexpectedErrors: []
    }

    addAssert(assert);

    function complete (label, diagram) {
      calledComplete++;

      completeStore[label] = diagram;

      if (calledComplete === 2) {
        const equal = deepEqual(completeStore['actual'], completeStore['expected']);

        let pass = true;

        completeStore['actual'].forEach((actual, index) => {
          const expected = completeStore['expected'][index];

          if (!actual || !expected) {
            pass = false;
            return;
          }

          if (actual.type !== expected.type) {
            pass = false;
          }

          if (actual.type === 'next') {
            const rightTime = diagramFrame(actual.time, interval) === diagramFrame(expected.time, interval);
            const rightValue = deepEqual(actual.value, expected.value);

            if (!rightTime || !rightValue) {
              pass = false;
            }
          }

          if (actual.type === 'error') {
            const rightTime = diagramFrame(actual.time, interval) === diagramFrame(expected.time, interval);

            if (expected.type !== 'error') {
              pass = false;
            }

            if (!rightTime) {
              pass = false;
            }

            if (!pass) {
              assert.unexpectedErrors.push(actual.error);
            }
          }
        });

        if (pass) {
          assert.state = 'passed';
        } else {
          assert.state = 'failed';
          assert.error = new Error(strip(`
            Expected

            ${diagramString(completeStore['expected'], interval)}

            Got

            ${diagramString(completeStore['actual'], interval)}

            ${displayUnexpectedErrors(assert.unexpectedErrors)}
          `));
        }
      }
    }

    const completeListener = (label) => {
      const entries = [];

      return {
        next (ev) {
          entries.push({type: 'next', value: ev, time: currentTime()});
        },

        complete () {
          entries.push({type: 'complete', time: currentTime()});

          complete(label, entries)
        },

        error (error) {
          entries.push({type: 'error', time: currentTime(), error});

          complete(label, entries);
        }
      }
    }

    actual.addListener(completeListener('actual'))
    expected.addListener(completeListener('expected'))
  }
}

function fill (array, value) {
  let i = 0;

  while (i < array.length) {
    array[i] = value;

    i++;
  }

  return array;
}

function diagramFrame (time, interval) {
  return Math.ceil(time / interval);
}

function diagramString (entries, interval): string {
  const maxTime = Math.max(...entries.map(entry => entry.time));

  const characterCount = Math.ceil(maxTime / interval);

  const diagram = fill(new Array(characterCount), '-');

  entries.forEach(entry => {
    const characterIndex = Math.max(0, Math.floor(entry.time / interval));

    if (entry.type === 'next') {
      diagram[characterIndex] = stringifyIfObject(entry.value);
    }

    if (entry.type == 'complete') {
      diagram[characterIndex] = '|';
    }

    if (entry.type === 'error') {
      diagram[characterIndex] = '#';
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

function strip (str: string): string {
  const lines = str.split("\n");

  return lines
    .map(line => line.replace(/^\s{12}/, ''))
    .join("\n")
}

function stringifyIfObject (value): string {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

function displayUnexpectedErrors (errors) {
  if (errors.length === 0) {
    return ``;
  }

  const messages = errors.map(error => error.stack).join('\n \n ');

  return `Unexpected error:\n ${messages}`;
}

export {
  makeAssertEqual
}
