import xs, {Stream} from 'xstream';
import * as deepEqual from 'deep-equal';

function checkEqual (completeStore, assert, interval) {
  const equal = deepEqual(completeStore['actual'], completeStore['expected']);

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

    if (actual.type === 'next') {
      const rightTime = diagramFrame(actual.time, interval) === diagramFrame(expected.time, interval);
      const rightValue = deepEqual(actual.value, expected.value);

      if (rightValue && !rightTime) {
        failReasons.push(`Right value at wrong time, expected at ${expected.time} but happened at ${actual.time} (${JSON.stringify(actual.value)})`);
      }

      if (!rightTime || !rightValue) {
        failReasons.push(`Expected value ${JSON.stringify(expected.value)} at time ${expected.time} but got ${JSON.stringify(actual.value)} at ${actual.time}`);
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

      Failed because

      ${failReasons[0]}

      ${displayUnexpectedErrors(assert.unexpectedErrors)}
    `));
  }
}

function makeAssertEqual (timeSource, schedule, currentTime, interval, addAssert) {
  return function assertEqual (actual: Stream<any>, expected: Stream<any>) {
    let calledComplete = 0;
    let completeStore = {};

    const Time = timeSource();

    const assert = {
      state: 'pending',
      error: null,
      unexpectedErrors: [],
      finish: () => {
        checkEqual(completeStore, assert, interval);
      }
    }

    addAssert(assert);

    const actualLog$ = xs.fromObservable(actual).compose(Time.record);
    const expectedLog$ = xs.fromObservable(expected).compose(Time.record);

    xs.combine(xs.fromObservable(actualLog$), xs.fromObservable(expectedLog$)).addListener({
      next ([aLog, bLog]) {
        completeStore['actual'] = aLog;
        completeStore['expected'] = bLog;
      },

      complete () {
        checkEqual(completeStore, assert, interval);
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

function diagramString (entries, interval): string {
  if (entries.length === 0) {
    return '<empty stream>';
  }

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
