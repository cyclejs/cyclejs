import * as assert from 'assert';
import {makeTimeDriver} from '../src/time-driver';
import {mockDOMSource} from '@cycle/dom';
import xs, {Stream} from 'xstream';
import adapter from '@cycle/xstream-adapter';

describe("@cycle/time", () => {
  describe(".assertEqual", () => {
    it("allows testing via marble diagrams", (done) => {
      const time = makeTimeDriver()();

      const input = time.diagram(
        `---1---2---3---|`
      );

      const expected = time.diagram(
        `---2---4---6---|`
      );

      const value = input.map(i => i * 2);

      time.assertEqual(
        value,
        expected,
        done
      );

      time.run();
    });

    it("fails when actual differs from expected", (done) => {
      const time = makeTimeDriver()();

      const input = time.diagram(
        `---1---2---3---|`
      );

      const expected = time.diagram(
        `---2---4---5---|`
      );

      const value = input.map(i => i * 2);

      time.assertEqual(
        value,
        expected,
        (err) => {
          if (err) {
            const lines = err.message.split(/\s+/).filter(a => a.length > 0);

            assert.deepEqual(lines, [
              'Expected',
              '---2---4---5---|',
              'Got',
              '---2---4---6---|',
            ])

            done();
          } else {
            throw new Error('expected test to fail');
          }
        }
      );

      time.run();
    });

    it("handles errors", (done) => {
      const time = makeTimeDriver()();

      const stream = xs.throw(new Error('Test!'));
      const expected = '*';

      time.assertEqual(
        stream,
        time.diagram(expected),
        done
      );

      time.run();
    });
  });

  describe(".periodic", () => {
    it("creates a stream that emits every period ms", (done) => {
      const time = makeTimeDriver()();

      const stream = time.periodic(80);

      const expected = time.diagram(
        `---0---1---2---3---4|`
      );

      time.assertEqual(
        stream.take(5),
        expected,
        done
      );

      time.run();
    });
  });

  describe(".delay", () => {
    it("delays events by the given period", (done) => {
      const time = makeTimeDriver()();

      const input = time.diagram(
        `---1---2---3---|`
      );

      const expected = time.diagram(
        `------1---2---3---|`
      );

      const value = input.compose(time.delay(60));

      time.assertEqual(
        value,
        expected,
        done
      );

      time.run();
    });

    it("propagates errors", (done) => {
      const time = makeTimeDriver()();

      const stream = xs.throw(new Error('Test!')).compose(time.delay(80));
      const expected = '---*';

      time.assertEqual(
        stream,
        time.diagram(expected),
        done
      );

      time.run();
    });
  })

  describe(".debounce", () => {
    it("delays events until the period has passed", (done) => {
      const time = makeTimeDriver()();

      const input    = `--1----2-3----|`;
      const expected = `-----1------3-|`;

      const stream = time.diagram(input).compose(time.debounce(60));
      const expectedStream = time.diagram(expected);

      time.assertEqual(
        stream,
        expectedStream,
        done
      );

      time.run();
    });

    it("propagates errors", (done) => {
      const time = makeTimeDriver()();

      const stream   = time.diagram('---1-2---3-*');
      const expected = time.diagram('--------2--*');

      time.assertEqual(
        stream.compose(time.debounce(60)),
        expected,
        done
      );

      time.run();
    });
  });

  describe(".throttle", () => {
    it("only allows one event per period", (done) => {
      const time = makeTimeDriver()();

      const input    = `--1-2-----3--4-5---6-|`;
      const expected = `--1-------3----5---6-|`;
      const stream = time.diagram(input).compose(time.throttle(60));
      const expectedStream = time.diagram(expected);

      time.assertEqual(
        stream,
        expectedStream,
        done
      );

      time.run();
    });

    it("propagates errors", (done) => {
      const time = makeTimeDriver()();

      const stream   = time.diagram('---1-2---3-*');
      const expected = time.diagram('---1-----3-*');

      time.assertEqual(
        stream.compose(time.throttle(60)),
        expected,
        done
      );

      time.run();
    });
  });

  it("can be used to test Cycle apps", (done) => {
    function Counter ({DOM}) {
      const add$ = DOM
        .select('.add')
        .events('click')
        .mapTo(+1);

      const subtract$ = DOM
        .select('.subtract')
        .events('click')
        .mapTo(-1);

      const change$ = xs.merge(add$, subtract$);

      const add = (a, b) => a + b;

      const count$ = change$.fold(add, 0);

      return {
        count$
      }
    }

    const time = makeTimeDriver()();

    const addClick      = '---x-x-x------x-|';
    const subtractClick = '-----------x----|';

    const expectedCount = '0--1-2-3---2--3-|';

    const DOM = mockDOMSource(adapter, {
      '.add': {
        'click': time.diagram(addClick)
      },
      '.subtract': {
        'click': time.diagram(subtractClick)
      }
    });

    const counter = Counter({DOM});

    time.assertEqual(
      counter.count$,
      time.diagram(expectedCount),
      done
    );

    time.run();
  });
});
