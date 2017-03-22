import xs, {Stream} from 'xstream';
import {deepEqual} from 'assert';
import * as variableDiff from 'variable-diff';

function checkEqual (completeStore, assert, interval, comparator) {
  const usingCustomComparator = comparator !== deepEqual;
  let failReasons = [];

  if (completeStore['actual'].length !== completeStore['expected'].length) {
    failReasons.push(`Length of actual and expected differs`);
  }

  completeStore['actual'].forEach((actual, index) => {
    const expected = completeStore['expected'][index];

    if (actual === undefined) {
      failReasons.push(`Actual at index ${index} was undefined`);
      return;
    }

    if (expected === undefined) {
      failReasons.push(`Expected at index ${index} was undefined`);
      return;
    }

    if (actual.type !== expected.type) {
      failReasons.push(`Expected type ${expected.type} at time ${actual.time} but got ${actual.type}`);
    }

    if (actual.type === 'complete') {
      const rightTime = diagramFrame(actual.time, interval) === diagramFrame(expected.time, interval);

      if (!rightTime) {
        failReasons.push(`Expected stream to complete at ${expected.time} but completed at ${actual.time}`);
      }
    }

    if (actual.type === 'next') {
      const rightTime = diagramFrame(actual.time, interval) === diagramFrame(expected.time, interval);
      let rightValue = true;

      try {
        const comparatorResult = comparator(actual.value, expected.value);

        if (typeof(comparatorResult) === "boolean") {
          rightValue = comparatorResult;
        }
      } catch (error) {
        rightValue = false;

        assert.unexpectedErrors.push(error);
      }

      if (rightValue && !rightTime) {
        failReasons.push(`Right value at wrong time, expected at ${expected.time} but happened at ${actual.time} (${JSON.stringify(actual.value)})`);
      }

      if (!rightTime || !rightValue) {
        const errorMessage = [
          `Expected value at time ${expected.time} but got different value at ${actual.time}\n`,
          `Expected ${JSON.stringify(expected.value)}, got ${JSON.stringify(actual.value)}`
        ];

        if (!usingCustomComparator) {
          const diffMessage = [
            `Diff (actual => expected):`,
            variableDiff(actual.value, expected.value).text
          ].join('\n');

          errorMessage.push(diffMessage);
        }

        failReasons.push(errorMessage.join('\n'));
      }
    }

    if (actual.type === 'error') {
      const rightTime = diagramFrame(actual.time, interval) === diagramFrame(expected.time, interval);
      let pass = true;

      if (expected.type !== 'error') {
        pass = false;
      }

      if (!rightTime) {
        pass = false;
      }

      if (!pass) {
        failReasons.push(`Unexpected error occurred`);
        assert.unexpectedErrors.push(actual.error);
      }
    }
  });

  if (failReasons.length === 0) {
    assert.state = 'passed';
  } else {
    assert.state = 'failed';
    assert.error = new Error(strip(`
Expected

${diagramString(completeStore['expected'], interval)}

Got

${diagramString(completeStore['actual'], interval)}

Failed because:

${failReasons.map(reason => ` * ${reason}`).join('\n')}

${displayUnexpectedErrors(assert.unexpectedErrors)}
    `));
  }
}

function makeAssertEqual (timeSource, schedule, currentTime, interval, addAssert) {
  return function assertEqual (actual: Stream<any>, expected: Stream<any>, comparator = deepEqual) {
    let calledComplete = 0;
    let completeStore = {};

    const Time = timeSource();

    const assert = {
      state: 'pending',
      error: null,
      unexpectedErrors: [],
      finish: () => {
        checkEqual(completeStore, assert, interval, comparator);
      }
    }

    addAssert(assert);

    const actualLog$ = Time.record(actual);
    const expectedLog$ = Time.record(expected);

    xs.combine(xs.fromObservable(actualLog$), xs.fromObservable(expectedLog$)).addListener({
      next ([aLog, bLog]) {
        completeStore['actual'] = aLog;
        completeStore['expected'] = bLog;
      },

      complete () {
        checkEqual(completeStore, assert, interval, comparator);
      }
    });
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

function chunkBy (values, f) {
  function chunkItGood ({items, previousValue}, value) {
    const v = f(value);

    if (v !== previousValue) {
      return {
        items: [...items, [value]],
        previousValue: v
      }
    }

    const lastItem = items[items.length - 1];

    return {
      items: items.slice(0, -1).concat([lastItem.concat(value)]),
      previousValue
    }
  }

  return values.reduce(chunkItGood, {items: [], previousValue: undefined}).items;
}

function characterString (entry) {
  if (entry.type === 'next') {
    return stringifyIfObject(entry.value);
  }

  if (entry.type == 'complete') {
    return '|';
  }

  if (entry.type === 'error') {
    return '#';
  }
}

function diagramString (entries, interval): string {
  if (entries.length === 0) {
    return '<empty stream>';
  }

  const maxTime = Math.max(...entries.map(entry => entry.time));

  const characterCount = Math.ceil(maxTime / interval);

  const diagram = fill(new Array(characterCount), '-');

  const chunks = chunkBy(entries, entry => Math.max(0, Math.floor(entry.time / interval)));

  chunks.forEach(chunk => {
    const characterIndex = Math.max(0, Math.floor(chunk[0].time / interval));

    if (chunk.length === 1) {
      diagram[characterIndex] = characterString(chunk[0]);
    } else {
      const characters = ['(', ...chunk.map(characterString), ')'];

      characters.forEach((character, subIndex) => {
        diagram[characterIndex + subIndex] = character;
      });
    }
  });

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
