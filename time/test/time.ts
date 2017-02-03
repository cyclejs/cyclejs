import * as assert from 'assert';
import {mockTimeSource, timeDriver} from '../src/';
import {mockDOMSource} from '@cycle/dom';
import xs, {Stream} from 'xstream';
import adapter from '@cycle/xstream-adapter';

describe("@cycle/time", () => {
  describe("mockTimeSource", () => {
    describe(".diagram", () => {
      it("creates streams from ascii diagrams", (done) => {
        const Time = mockTimeSource();

        const stream = Time.diagram(
          `---1---2---3---|`
        );

        const expectedValues = [1, 2, 3];

        stream.take(expectedValues.length).addListener({
          next (ev) {
            assert.equal(ev, expectedValues.shift());
          },

          complete: done,
          error: done
        });

        Time.run();
      });

      it("schedules errors", (done) => {
        const Time = mockTimeSource();

        const stream = Time.diagram(
          `---1---2---#`
        );

        const expectedValues = [1, 2];

        stream.addListener({
          next (ev) {
            assert.equal(ev, expectedValues.shift());
          },

          complete: () => {},
          error: (error) => {
            assert.equal(expectedValues.length, 0);
            done();
          }
        });

        Time.run();
      });

      it("optionally takes an object of values", (done) => {
        const Time = mockTimeSource();

        const stream = Time.diagram(
          `---A---B---C---|`,
          {
            A: {foo: 1},
            B: {foo: 2},
            C: {foo: 3}
          }
        );

        const expectedValues = [
          {foo: 1},
          {foo: 2},
          {foo: 3}
        ];

        stream.take(expectedValues.length).addListener({
          next (ev) {
            assert.deepEqual(ev, expectedValues.shift());
          },

          complete: done,
          error: done
        });

        Time.run();
      });
    });

    describe(".assertEqual", () => {
      it("allows testing via marble diagrams", (done) => {
        const Time = mockTimeSource();

        const input = Time.diagram(
          `---1---2---3---|`
        );

        const value = input.map(i => i * 2);

        const expected = Time.diagram(
          `---2---4---6---|`
        );

        Time.assertEqual(
          value,
          expected
        );

        Time.run(done);
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

        const complete = (err) => {
          if (err) {
            const lines = err.message.split(/\s+/).filter(a => a.length > 0);

            assert([
              'Expected',
              '---2---4---5---|',
              'Got',
              '---2---4---6---|',
            ].every(expectedLine => lines.includes(expectedLine)));

            done();
          } else {
            throw new Error('expected test to fail');
          }
        }

        Time.assertEqual(
          value,
          expected
        );

        Time.run(complete);
      });

      it("stringifies objects", (done) => {
        const Time = mockTimeSource();

        const input = Time.diagram(
          `---1---2---3---|`
        );

        const expected = Time.diagram(
          `---a-------b---|`,
          {a: {a: 1}, b: {a: 2}}
        );

        const complete = (err) => {
          if (err) {
            const lines = err.message.split(/\s+/).filter(a => a.length > 0);

            assert([
              'Expected',
              '---{"a":1}-------{"a":2}---|',
              'Got',
              '---1---2---3---|',
            ].every(expectedLine => lines.includes(expectedLine)));

            done();
          } else {
            throw new Error('expected test to fail');
          }
        }

        Time.assertEqual(
          input,
          expected
        );

        Time.run(complete);
      });

      it("handles errors", (done) => {
        const Time = mockTimeSource();

        const stream = xs.throw(new Error('Test!'));
        const expected = '#';

        Time.assertEqual(
          stream,
          Time.diagram(expected)
        );

        Time.run(done);
      });

      it("compares objects using deep equality", (done) => {
        const Time = mockTimeSource();

        const actual = Time.diagram(
          `---A---B---C---|`,
          {
            A: {foo: 1},
            B: {foo: 2},
            C: {foo: 3}
          }
        );

        const expected = Time.diagram(
          `---X---Y---Z---|`,
          {
            X: {foo: 1},
            Y: {foo: 2},
            Z: {foo: 3}
          }
        );

        Time.assertEqual(actual, expected);
        Time.run(done);
      });

      it("logs unexpected errors", (done) => {
        const Time = mockTimeSource();

        const input$ = Time.diagram(
          `---A---B---C---|`
        );

        const expectedError = 'Something went unexpectedly wrong!';

        function transformation (character) {
          if (character === 'A') {
            return 'X';
          }

          if (character === 'B') {
            throw new Error(expectedError);
          }
        }

        const actual$ = input$.map(transformation);

        const expected$ = Time.diagram(
          `---X---Y---Z---|`
        );

        Time.assertEqual(actual$, expected$);
        Time.run((err) => {
          if (!err) {
            done(new Error('expected test to fail'));
          }

          assert(
            err.message.includes(expectedError),
            [
              'Expected failure message to include error, did not:',
              err.message,
              'to include:',
              expectedError
            ].join('\n\n')
          );

          done();
        });
      });

      it("handles infinite streams", (done) => {
        const Time = mockTimeSource();

        const input    = Time.diagram('---1---2---3---');
        const actual   = input.map(i => i * 2);
        const expected = Time.diagram('---2---4---6---');

        Time.assertEqual(actual, expected);

        Time.run(done);
      });

      it("handles infinite streams that have failures", (done) => {
        const Time = mockTimeSource();

        const input    = Time.diagram('---1---2---3---');
        const actual   = input.map(i => i * 2);
        const expected = Time.diagram('---2---7---6---');

        Time.assertEqual(actual, expected);

        Time.run((err) => {
          if (!err) {
            return done(new Error('expected test to fail'));
          }

          done();
        });
      });
    });

    describe(".periodic", () => {
      it("creates a stream that emits every period ms", (done) => {
        const Time = mockTimeSource();

        const stream = Time.periodic(80);

        const expected = Time.diagram(
          `----0---1---2---3---4|`
        );

        Time.assertEqual(
          stream.take(5),
          expected
        );

        Time.run(done);
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
          expected
        );

        Time.run(done);
      });

      it("propagates errors", (done) => {
        const Time = mockTimeSource();

        const stream = xs.throw(new Error('Test!')).compose(Time.delay(60));
        const expected = '---#';

        Time.assertEqual(
          stream,
          Time.diagram(expected)
        );

        Time.run(done);
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
          expectedStream
        );

        Time.run(done);
      });

      it("propagates errors", (done) => {
        const Time = mockTimeSource();

        const stream   = Time.diagram('---1-2---3-#');
        const expected = Time.diagram('--------2--#');

        Time.assertEqual(
          stream.compose(Time.debounce(60)),
          expected
        );

        Time.run(done);
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
          expectedStream
        );

        Time.run(done);
      });

      it("propagates errors", (done) => {
        const Time = mockTimeSource();

        const stream   = Time.diagram('---1-2---3-#');
        const expected = Time.diagram('---1-----3-#');

        Time.assertEqual(
          stream.compose(Time.throttle(60)),
          expected
        );

        Time.run(done);
      });
    });

    describe('.animationFrames', () => {
      it('provides a stream of frames for animations', (done) => {
        const Time = mockTimeSource({interval: 8});

        const frames = [0, 1, 2].map(i => (
          {
            time: i * 16,
            delta: 16,
            normalizedDelta: 1
          }
        ));

        const actual$ = Time.animationFrames().take(frames.length);
        const expected$ = Time.diagram(
          `--0-1-2|`,
          frames
        );

        Time.assertEqual(actual$, expected$);

        Time.run(done);
      });
    });

    describe('.throttleAnimation', () => {
      it('throttles a stream using animationFrames', (done) => {
        const Time = mockTimeSource({interval: 8});

        const noisy$    = Time.diagram(`-aaaa-aa-aaa-aa|`);
        const actual$   = noisy$.compose(Time.throttleAnimation);
        const expected$ = Time.diagram(`--a-a-a-a-a-a-a|`);

        Time.assertEqual(actual$, expected$);

        Time.run(done);
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
        Time.diagram(expectedCount)
      );

      Time.run(done);
    });
  });
});
