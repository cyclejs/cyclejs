import xs, {Stream} from 'xstream';

function makeAssertEqual (scheduleEntry, currentTime, interval, addAssert) {
  return function assertEqual (actual: Stream<any>, expected: Stream<any>) {
    let calledComplete = 0;
    let completeStore = {};

    const assert = {
      state: 'pending',
      error: null
    }

    addAssert(assert);

    function complete (label, diagram) {
      calledComplete++;

      completeStore[label] = diagram;

      if (calledComplete === 2) {
        const equal = completeStore['actual'] === completeStore['expected'];

        if (equal) {
          assert.state = 'passed';
        } else {
          assert.state = 'failed';
          assert.error = new Error(`
            Expected

            ${completeStore['expected']}

            Got

            ${completeStore['actual']}
          `.replace(/^\s{6}/, ''));
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

          complete(label, diagramString(entries, interval))
        },

        error (error) {
          entries.push({type: 'error', time: currentTime(), error});

          complete(label, diagramString(entries, interval));
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

export {
  makeAssertEqual
}
