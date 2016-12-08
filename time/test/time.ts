import * as assert from 'assert';
import {mockTimeSource, timeDriver} from '../src/time-driver';
import {mockDOMSource} from '@cycle/dom';
import xs, {Stream} from 'xstream';
import adapter from '@cycle/xstream-adapter';

describe("@cycle/time", () => {
  describe("makeTimeDriver", () => {
    it("returns a Time source", () => {
      const Time = timeDriver(null, adapter);

      const keys = Object.keys(Time).sort();

      assert.deepEqual(keys, [
        "debounce",
        "delay",
        "periodic",
        "throttle"
      ]);
    });
  });

  describe("mockDOMSource", () => {
    it("returns a virtual Time source", () => {
      const Time = mockTimeSource();

      const keys = Object.keys(Time).sort();

      assert.deepEqual(keys, [
        "assertEqual",
        "debounce",
        "delay",
        "diagram",
        "periodic",
        "run",
        "throttle",
      ]);
    });

    describe(".assertEqual", () => {
      it("allows testing via marble diagrams", (done) => {
        const Time = mockTimeSource();

        const input = Time.diagram(
          `---1---2---3---|`
        );

        const expected = Time.diagram(
          `---2---4---6---|`
        );

        const value = input.map(i => i * 2);

        Time.assertEqual(
          value,
          expected,
          done
        );

        Time.run();
      });

      it("fails when actual differs from expected", (done) => {
        const Time = mockTimeSource();

        const input = Time.diagram(
          `---1---2---3---|`
        );

        const expected = Time.diagram(
          `---2---4---5---|`
        );

        const value = input.map(i => i * 2);

        Time.assertEqual(
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

        Time.run();
      });

      it("handles errors", (done) => {
        const Time = mockTimeSource();

        const stream = xs.throw(new Error('Test!'));
        const expected = '*';

        Time.assertEqual(
          stream,
          Time.diagram(expected),
          done
        );

        Time.run();
      });
    });

    describe(".periodic", () => {
      it("creates a stream that emits every period ms", (done) => {
        const Time = mockTimeSource();

        const stream = Time.periodic(80);

        const expected = Time.diagram(
          `---0---1---2---3---4|`
        );

        Time.assertEqual(
          stream.take(5),
          expected,
          done
        );

        Time.run();
      });
    });

    describe(".delay", () => {
      it("delays events by the given period", (done) => {
        const Time = mockTimeSource();

        const input = Time.diagram(
          `---1---2---3---|`
        );

        const expected = Time.diagram(
          `------1---2---3---|`
        );

        const value = input.compose(Time.delay(60));

        Time.assertEqual(
          value,
          expected,
          done
        );

        Time.run();
      });

      it("propagates errors", (done) => {
        const Time = mockTimeSource();

        const stream = xs.throw(new Error('Test!')).compose(Time.delay(80));
        const expected = '---*';

        Time.assertEqual(
          stream,
          Time.diagram(expected),
          done
        );

        Time.run();
      });
    })

    describe(".debounce", () => {
      it("delays events until the period has passed", (done) => {
        const Time = mockTimeSource();

        const input    = `--1----2-3----|`;
        const expected = `-----1------3-|`;

        const stream = Time.diagram(input).compose(Time.debounce(60));
        const expectedStream = Time.diagram(expected);

        Time.assertEqual(
          stream,
          expectedStream,
          done
        );

        Time.run();
      });

      it("propagates errors", (done) => {
        const Time = mockTimeSource();

        const stream   = Time.diagram('---1-2---3-*');
        const expected = Time.diagram('--------2--*');

        Time.assertEqual(
          stream.compose(Time.debounce(60)),
          expected,
          done
        );

        Time.run();
      });
    });

    describe(".throttle", () => {
      it("only allows one event per period", (done) => {
        const Time = mockTimeSource();

        const input    = `--1-2-----3--4-5---6-|`;
        const expected = `--1-------3----5---6-|`;
        const stream = Time.diagram(input).compose(Time.throttle(60));
        const expectedStream = Time.diagram(expected);

        Time.assertEqual(
          stream,
          expectedStream,
          done
        );

        Time.run();
      });

      it("propagates errors", (done) => {
        const Time = mockTimeSource();

        const stream   = Time.diagram('---1-2---3-*');
        const expected = Time.diagram('---1-----3-*');

        Time.assertEqual(
          stream.compose(Time.throttle(60)),
          expected,
          done
        );

        Time.run();
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

      const Time = mockTimeSource();

      const addClick      = '---x-x-x------x-|';
      const subtractClick = '-----------x----|';

      const expectedCount = '0--1-2-3---2--3-|';

      const DOM = mockDOMSource(adapter, {
        '.add': {
          'click': Time.diagram(addClick)
        },
        '.subtract': {
          'click': Time.diagram(subtractClick)
        }
      });

      const counter = Counter({DOM});

      Time.assertEqual(
        counter.count$,
        Time.diagram(expectedCount),
        done
      );

      Time.run();
    });
  });
});
