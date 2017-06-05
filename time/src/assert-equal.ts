import xs, {Stream} from 'xstream';
import {deepEqual} from 'assert';
const variableDiff = require('variable-diff');

function checkEqual(
  completeStore: any,
  assert: any,
  interval: number,
  comparator: any,
) {
  const usingCustomComparator = comparator !== deepEqual;
  const failReasons: Array<any> = [];

  if (completeStore['actual'].length !== completeStore['expected'].length) {
    failReasons.push(`Length of actual and expected differs`);
  }

  completeStore['actual'].forEach((actual: any, index: number) => {
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
      failReasons.push(
        `Expected type ${expected.type} at time ${actual.time} but got ${actual.type}`,
      );
    }

    if (actual.type === 'complete') {
      const rightTime =
        diagramFrame(actual.time, interval) ===
        diagramFrame(expected.time, interval);

      if (!rightTime) {
        failReasons.push(
          `Expected stream to complete at ${expected.time} but completed at ${actual.time}`,
        );
      }
    }

    if (actual.type === 'next') {
      const rightTime =
        diagramFrame(actual.time, interval) ===
        diagramFrame(expected.time, interval);
      let rightValue = true;

      try {
        const comparatorResult = comparator(actual.value, expected.value);
        if (typeof comparatorResult === 'boolean') {
          rightValue = comparatorResult;
        }
      } catch (error) {
        rightValue = false;
        assert.unexpectedErrors.push(error);
      }

      if (rightValue && !rightTime) {
        failReasons.push(
          `Right value at wrong time, expected at ${expected.time} but ` +
            `happened at ${actual.time} (${JSON.stringify(actual.value)})`,
        );
      }

      if (!rightTime || !rightValue) {
        const errorMessage = [
          `Expected value at time ${expected.time} but got different value at ${actual.time}\n`,
        ];

        if (usingCustomComparator) {
          const message = `Expected ${JSON.stringify(
            expected.value,
          )}, got ${JSON.stringify(actual.value)}`;

          errorMessage.push(message);
        } else {
          const diffMessage = [
            `Diff (actual => expected):`,
            variableDiff(actual.value, expected.value).text,
          ].join('\n');

          errorMessage.push(diffMessage);
        }

        failReasons.push(errorMessage.join('\n'));
      }
    }

    if (actual.type === 'error') {
      const rightTime =
        diagramFrame(actual.time, interval) ===
        diagramFrame(expected.time, interval);
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
    assert.error = new Error(
      strip(`
Expected

${diagramString(completeStore['expected'], interval)}

Got

${diagramString(completeStore['actual'], interval)}

Failed because:

${failReasons.map(reason => ` * ${reason}`).join('\n')}

${displayUnexpectedErrors(assert.unexpectedErrors)}
    `),
    );
  }
}

function makeAssertEqual(
  timeSource: any,
  schedule: any,
  currentTime: () => number,
  interval: number,
  addAssert: any,
) {
  return function assertEqual(
    actual: Stream<any>,
    expected: Stream<any>,
    comparator = deepEqual,
  ) {
    const completeStore = {};

    const Time = timeSource();

    const assert = {
      state: 'pending',
      error: null,
      unexpectedErrors: [],
      finish: () => {
        checkEqual(completeStore, assert, interval, comparator);
      },
    };

    addAssert(assert);

    const actualLog$ = Time.record(actual);
    const expectedLog$ = Time.record(expected);

    xs
      .combine(xs.fromObservable(actualLog$), xs.fromObservable(expectedLog$))
      .addListener({
        next([aLog, bLog]) {
          completeStore['actual'] = aLog;
          completeStore['expected'] = bLog;
        },

        complete() {
          checkEqual(completeStore, assert, interval, comparator);
        },
      });
  };
}

function fill<T>(array: Array<T>, value: T) {
  let i = 0;
  while (i < array.length) {
    array[i] = value;
    i++;
  }
  return array;
}

function diagramFrame(time: number, interval: number): number {
  return Math.ceil(time / interval);
}

function chunkBy(values: Array<any>, f: any) {
  function chunkItGood({items, previousValue}: any, value: any) {
    const v = f(value);

    if (v !== previousValue) {
      return {
        items: [...items, [value]],
        previousValue: v,
      };
    }

    const lastItem = items[items.length - 1];

    return {
      items: items.slice(0, -1).concat([lastItem.concat(value)]),
      previousValue,
    };
  }

  return values.reduce(chunkItGood, {items: [], previousValue: undefined})
    .items;
}

function characterString(entry: any) {
  if (entry.type === 'next') {
    return stringifyIfObject(entry.value);
  }

  if (entry.type === 'complete') {
    return '|';
  }

  if (entry.type === 'error') {
    return '#';
  }
}

function diagramString(entries: Array<any>, interval: number): string {
  if (entries.length === 0) {
    return '<empty stream>';
  }

  const maxTime = Math.max(...entries.map(entry => entry.time));

  const characterCount = Math.ceil(maxTime / interval);

  const diagram = fill(new Array(characterCount), '-');

  const chunks = chunkBy(entries, (entry: any) =>
    Math.max(0, Math.floor(entry.time / interval)),
  );

  chunks.forEach((chunk: any) => {
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

function strip(str: string): string {
  const lines = str.split('\n');

  return lines.map(line => line.replace(/^\s{12}/, '')).join('\n');
}

function stringifyIfObject(value: any): string {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

function displayUnexpectedErrors(errors: Array<any>) {
  if (errors.length === 0) {
    return ``;
  }

  const messages = errors.map(error => error.stack).join('\n \n ');

  return `Unexpected error:\n ${messages}`;
}

export {makeAssertEqual};
