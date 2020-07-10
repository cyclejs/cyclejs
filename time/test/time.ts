import * as assert from 'assert';
import {mockTimeSource, timeDriver, TimeSource, Operator} from '../index';
import {mockDOMSource} from '@cycle/dom';
import xs, {Stream} from 'xstream';
import {setAdapt, adapt} from '@cycle/run/lib/adapt';
import * as rx from 'rxjs';
const {Observable, from} = rx;
import * as rxOps from 'rxjs/operators';
import * as most from 'most';

const libraries = [
  {name: 'xstream', adapt: (stream: Stream<any>) => stream, lib: xs},
  {
    name: 'rxjs',
    adapt: from as any,
    lib: rx,
  },
  {name: 'most', adapt: (stream: Stream<any>) => most.from(stream), lib: most},
];

function compose(stream: any, f: any) {
  if ('compose' in stream) {
    return stream.compose(f);
  }

  if ('pipe' in stream) {
    return stream.pipe(f);
  }

  if ('thru' in stream) {
    return stream.thru(f);
  }

  throw new Error(`Don't know how to compose`);
}

function take(stream: any, n: number) {
  if (stream instanceof Observable) {
    return stream.pipe(rxOps.take(n));
  }

  return stream.take(n);
}

function map(stream: any, f: any) {
  if (stream instanceof Observable) {
    return stream.pipe(rxOps.map(f));
  }

  return stream.map(f);
}

function testUnsubscription(Time: TimeSource, operator: any, done: Mocha.Done) {
  const PERIOD = 20;
  const taps: Array<number> = [];
  const custom = adapt(
    xs.create({
      start: listener => {
        listener.next(0);
        setTimeout(() => listener.next(1), 1 * PERIOD);
        setTimeout(() => listener.next(2), 2 * PERIOD);
        setTimeout(() => {
          listener.next(3);
          listener.complete();
        }, 3 * PERIOD);
      },
      stop: () => {
        assert.deepEqual(taps, [0]);
        Time.dispose();
        done();
      },
    })
  );

  const tapped = map(custom, (x: number) => {
    taps.push(x);
    return x;
  });

  const composed = compose(
    tapped,
    operator
  );

  take(composed, 1).subscribe({});
}

describe('@cycle/time', () => {
  before(() => setAdapt(stream => stream));

  it('can be used to test Cycle apps', done => {
    function Counter({DOM}: any) {
      const add$: Stream<number> = DOM.select('.add')
        .events('click')
        .mapTo(+1);

      const subtract$: Stream<number> = DOM.select('.subtract')
        .events('click')
        .mapTo(-1);

      const change$ = xs.merge(add$, subtract$);

      const add = (a: number, b: number) => a + b;

      const count$ = change$.fold(add, 0);

      return {
        count$,
      };
    }

    const Time = mockTimeSource();

    const addClick = '---x-x-x------x-|';
    const subtractClick = '-----------x----|';

    const expectedCount = '0--1-2-3---2--3-|';

    const _DOM = mockDOMSource({
      '.add': {
        click: Time.diagram(addClick),
      },
      '.subtract': {
        click: Time.diagram(subtractClick),
      },
    });

    const counter = Counter({DOM: _DOM});

    Time.assertEqual(counter.count$, Time.diagram(expectedCount));

    Time.run(done);
  });

  it('supports custom operators', done => {
    const Time = mockTimeSource({interval: 10});

    const input$ = Time.diagram('--1--2--3-------');
    const expected$ = Time.diagram('---1---2---3----');

    function delayBy(
      timeSource: TimeSource,
      delaySelector: (t: any) => number
    ): Operator {
      return function delayByOperator<T>(stream: Stream<T>): Stream<T> {
        return xs.create<T>({
          start(listener) {
            const {schedule, currentTime} = timeSource.createOperator<T>();

            stream.addListener({
              next(t: T) {
                const delay = delaySelector(t);

                schedule.next(listener, currentTime() + delay, t);
              },

              error(err: Error) {
                schedule.error(listener, currentTime(), err);
              },

              complete() {
                schedule.complete(listener, currentTime());
              },
            });
          },

          stop() {},
        });
      };
    }

    const actual$ = input$.compose(delayBy(Time, (i: number) => i * 10));

    Time.assertEqual(actual$, expected$);

    Time.run(done);
  });

  libraries.forEach(library => {
    describe(library.name, () => {
      before(() => setAdapt(library.adapt));

      describe('mockTimeSource', () => {
        describe('.diagram', () => {
          it('creates streams from ascii diagrams', done => {
            const Time = mockTimeSource();

            const stream = Time.diagram(`---1---2---3---|`);

            const expectedValues = [1, 2, 3];

            take(stream, expectedValues.length).subscribe({
              next(ev: number) {
                assert.equal(ev, expectedValues.shift());
              },

              complete: () => done(), // tslint:disable-line
              error: done,
            });

            Time.run();
          });

          it('schedules errors', done => {
            const Time = mockTimeSource();

            const stream = Time.diagram(`---1---2---#`);

            const expectedValues = [1, 2];

            stream.subscribe({
              next(ev) {
                assert.equal(ev, expectedValues.shift());
              },

              complete: () => {},
              error: error => {
                assert.equal(expectedValues.length, 0);
                done();
              },
            });

            Time.run();
          });

          it('optionally takes an object of values', done => {
            const Time = mockTimeSource();

            const stream = Time.diagram(`---A---B---C---|`, {
              A: {foo: 1},
              B: {foo: 2},
              C: {foo: 3},
            });

            const expectedValues = [{foo: 1}, {foo: 2}, {foo: 3}];

            take(stream, expectedValues.length).subscribe({
              next(ev: number) {
                assert.deepEqual(ev, expectedValues.shift());
              },

              complete: () => done(), // tslint:disable-line
              error: done,
            });

            Time.run();
          });

          it('handles multiple events in a single frame', done => {
            const Time = mockTimeSource();

            const a = Time.diagram('---a---');
            const b = Time.diagram('---b---');
            const expected = Time.diagram('---(ab)---');

            Time.assertEqual((library.lib as any).merge(a, b), expected);

            Time.run(done);
          });
        });

        describe('.assertEqual', () => {
          it('allows testing via marble diagrams', done => {
            const Time = mockTimeSource();

            const input = Time.diagram(`---1---2---3---|`);

            const value = map(input, (i: number) => i * 2);

            const expected = Time.diagram(`---2---4---6---|`);

            Time.assertEqual(value, expected);

            Time.run(done);
          });

          it('fails when actual differs from expected', done => {
            const Time = mockTimeSource();

            const input = Time.diagram(`---1---2---3---|`);

            const expected = Time.diagram(`---2---4---5---|`);

            const value = map(input, (i: number) => i * 2);

            const complete = (err: any) => {
              if (err) {
                const lines = err.message
                  .split(/\s+/)
                  .filter((a: string) => a.length > 0);

                assert(
                  [
                    'Expected',
                    '---2---4---5---|',
                    'Got',
                    '---2---4---6---|',
                  ].every(expectedLine => lines.indexOf(expectedLine) !== -1),
                  err.message
                );

                done();
              } else {
                throw new Error('expected test to fail');
              }
            };

            Time.assertEqual(value, expected);

            Time.run(complete);
          });

          it('stringifies objects', done => {
            const Time = mockTimeSource();

            const input = Time.diagram(`---1---2---3---|`);

            const expected = Time.diagram(`---a-------b---|`, {
              a: {a: 1},
              b: {a: 2},
            });

            const complete = (err: any) => {
              if (err) {
                const lines = err.message
                  .split(/\s+/)
                  .filter((a: string) => a.length > 0);

                assert(
                  [
                    'Expected',
                    '---{"a":1}-------{"a":2}---|',
                    'Got',
                    '---1---2---3---|',
                  ].every(expectedLine => lines.indexOf(expectedLine) !== -1)
                );

                done();
              } else {
                throw new Error('expected test to fail');
              }
            };

            Time.assertEqual(input, expected);

            Time.run(complete);
          });

          it('handles errors', done => {
            const Time = mockTimeSource();

            const stream = xs.throw(new Error('Test!'));
            const expected = '#';

            Time.assertEqual(stream, Time.diagram(expected));

            Time.run(done);
          });

          it('compares objects using deep equality by default', done => {
            const Time = mockTimeSource();

            const actual = Time.diagram(`---A---B---C---|`, {
              A: {foo: 1},
              B: {foo: 2},
              C: {foo: 3},
            });

            const expected = Time.diagram(`---X---Y---Z---|`, {
              X: {foo: 1},
              Y: {foo: 2},
              Z: {foo: 3},
            });

            Time.assertEqual(actual, expected);
            Time.run(done);
          });

          describe('custom equality functions', () => {
            it('passes', done => {
              const Time = mockTimeSource();

              const actual$ = Time.diagram(`---A---B---C---|`, {
                A: {foo: 1, bar: 2},
                B: {foo: 2, bar: 4},
                C: {foo: 3, bar: 6},
              });

              const expected$ = Time.diagram(`---X---Y---Z---|`, {
                X: {foo: 1, bar: 3},
                Y: {foo: 2, bar: 4},
                Z: {foo: 3, bar: 6},
              });

              function comparator(actual: any, expected: any) {
                return actual.foo === expected.foo;
              }

              Time.assertEqual(actual$, expected$, comparator);
              Time.run(done);
            });

            it('fails', done => {
              const Time = mockTimeSource();

              const actual$ = Time.diagram(`---A---B---C---|`, {
                A: {foo: 1, bar: 2},
                B: {foo: 2, bar: 4},
                C: {foo: 3, bar: 6},
              });

              const expected$ = Time.diagram(`---X---Y---Z---|`, {
                X: {foo: 5, bar: 3},
                Y: {foo: 2, bar: 4},
                Z: {foo: 3, bar: 6},
              });

              function comparator(actual: any, expected: any) {
                return actual.foo === expected.foo;
              }

              Time.assertEqual(actual$, expected$, comparator);

              Time.run(err => {
                if (!err) {
                  done(new Error('expected test to fail'));
                } else {
                  done();
                }
              });
            });

            it('logs errors', done => {
              const Time = mockTimeSource();

              const actual$ = Time.diagram(`---A---B---C---|`, {
                A: {foo: 1, bar: 2},
                B: {foo: 2, bar: 4},
                C: {foo: 3, bar: 6},
              });

              const expected$ = Time.diagram(`---X---Y---Z---|`, {
                X: {foo: 5, bar: 3},
                Y: {foo: 2, bar: 4},
                Z: {foo: 3, bar: 6},
              });

              function comparator(actual: any, expected: any) {
                if (actual.foo !== expected.foo) {
                  throw new Error('Something went wrong');
                }
              }

              Time.assertEqual(actual$, expected$, comparator);

              Time.run((err: any) => {
                if (!err) {
                  done(new Error('expected test to fail'));
                }

                assert(
                  err.message.indexOf('Something went wrong') !== -1,
                  [
                    'Expected failure message to include error, did not:',
                    err.message,
                    'to include:',
                    'Something went wrong',
                  ].join('\n\n')
                );

                done();
              });
            });
          });

          it('logs unexpected errors', done => {
            const Time = mockTimeSource();

            const input$ = Time.diagram(`---A---B---C---|`);

            const expectedError = 'Something went unexpectedly wrong!';

            function transformation(character: string) {
              if (character === 'A') {
                return 'X';
              }

              if (character === 'B') {
                throw new Error(expectedError);
              }
            }

            const actual$ = map(input$, transformation);

            const expected$ = Time.diagram(`---X---Y---Z---|`);

            Time.assertEqual(actual$, expected$);
            Time.run((err: any) => {
              if (!err) {
                done(new Error('expected test to fail'));
              }

              assert(
                err.message.indexOf(expectedError) !== -1,
                [
                  'Expected failure message to include error, did not:',
                  err.message,
                  'to include:',
                  expectedError,
                ].join('\n\n')
              );

              done();
            });
          });

          it('handles infinite streams', done => {
            const Time = mockTimeSource();

            const input = Time.diagram('---1---2---3---');
            const actual = map(input, (i: number) => i * 2);
            const expected = Time.diagram('---2---4---6---');

            Time.assertEqual(actual, expected);

            Time.run(done);
          });

          it('handles infinite streams that have failures', done => {
            const Time = mockTimeSource();

            const input = Time.diagram('---1---2---3---');
            const actual = map(input, (i: number) => i * 2);
            const expected = Time.diagram('---2---7---6---');

            Time.assertEqual(actual, expected);

            Time.run(err => {
              if (!err) {
                return done(new Error('expected test to fail'));
              }

              done();
            });
          });

          it('displays simultaneous events correctly', done => {
            const Time = mockTimeSource();

            const input = `---(11)---(22)---(33)---|`;
            const expected = `---(11)---(22)---(34)---|`;

            const complete = (err: any) => {
              if (err) {
                const lines = err.message
                  .split(/\s+/)
                  .filter((a: string) => a.length > 0);

                assert(
                  ['Expected', expected, 'Got', input].every(
                    expectedLine => lines.indexOf(expectedLine) !== -1
                  )
                );

                done();
              } else {
                throw new Error('expected test to fail');
              }
            };

            Time.assertEqual(Time.diagram(input), Time.diagram(expected));

            Time.run(complete);
          });
        });

        describe('.periodic', () => {
          it('creates a stream that emits every period ms', done => {
            const Time = mockTimeSource();

            const stream = Time.periodic(80);

            const expected = Time.diagram(`----0---1---2---3---4---`);

            Time.assertEqual(stream, expected);

            Time.run(done);
          });
        });

        describe('.delay', () => {
          it('delays events by the given period', done => {
            const Time = mockTimeSource();

            const input = Time.diagram(`---1---2---3---|`) as any;

            const expected = Time.diagram(`------1---2---3---|`);

            const value = compose(
              input,
              Time.delay(60)
            );

            Time.assertEqual(value, expected);

            Time.run(done);
          });

          it('propagates errors', done => {
            const Time = mockTimeSource();

            const stream = compose(
              xs.throw(new Error('Test!')),
              Time.delay(60)
            );
            const expected = '---#';

            Time.assertEqual(stream, Time.diagram(expected));

            Time.run(done);
          });

          it('unsubscribes', done => {
            const Time = timeDriver(xs.empty());
            testUnsubscription(Time, Time.delay(0), done);
          });
        });

        describe('.debounce', () => {
          it('delays events until the period has passed', done => {
            const Time = mockTimeSource();

            const input = `--1----2-3----|`;
            const expected = `-----1------3-|`;

            const stream = compose(
              Time.diagram(input),
              Time.debounce(60)
            );
            const expectedStream = Time.diagram(expected);

            Time.assertEqual(stream, expectedStream);

            Time.run(done);
          });

          it('propagates errors', done => {
            const Time = mockTimeSource();

            const stream = Time.diagram('---1-2---3-#');
            const expected = Time.diagram('--------2--#');

            Time.assertEqual(
              compose(
                stream,
                Time.debounce(60)
              ),
              expected
            );

            Time.run(done);
          });

          it('unsubscribes', done => {
            const Time = timeDriver(xs.empty());
            testUnsubscription(Time, Time.debounce(0), done);
          });
        });

        describe('.throttle', () => {
          it('only allows one event per period', done => {
            const Time = mockTimeSource();

            const input = `--1-2-----3--4-5---6-|`;
            const expected = `--1-------3----5---6-|`;
            const stream = compose(
              Time.diagram(input),
              Time.throttle(60)
            );
            const expectedStream = Time.diagram(expected);

            Time.assertEqual(stream, expectedStream);

            Time.run(done);
          });

          it('propagates errors', done => {
            const Time = mockTimeSource();

            const stream = Time.diagram('---1-2---3-#');
            const expected = Time.diagram('---1-----3-#');

            Time.assertEqual(
              compose(
                stream,
                Time.throttle(60)
              ),
              expected
            );

            Time.run(done);
          });

          context('with a synchronous stream', () => {
            it('fires an event before completing', done => {
              const Time = mockTimeSource();

              const stream = library.adapt(xs.from([1, 2, 3]));
              const expected = Time.diagram('(1|)');

              Time.assertEqual(
                compose(
                  stream,
                  Time.throttle(60)
                ),
                expected
              );

              Time.run(done);
            });
          });

          it('unsubscribes', done => {
            const Time = timeDriver(xs.empty());
            testUnsubscription(Time, Time.throttle(0), done);
          });
        });

        describe('.animationFrames', () => {
          it('provides a stream of frames for animations', done => {
            const Time = mockTimeSource({interval: 8});

            const frames = [0, 1, 2].map(i => ({
              time: i * 16,
              delta: 16,
              normalizedDelta: 1,
            }));

            const actual$ = Time.animationFrames();
            const expected$ = Time.diagram(`--0-1-2`, frames);

            Time.assertEqual(actual$, expected$);

            Time.run(done);
          });
        });

        describe('.throttleAnimation', () => {
          it('throttles a stream using animationFrames', done => {
            const Time = mockTimeSource({interval: 8});

            const noisy$ = Time.diagram(`-123456----`);
            const actual$ = compose(
              noisy$,
              Time.throttleAnimation
            );
            const expected$ = Time.diagram(`--2-4-6----`);

            Time.assertEqual(actual$, expected$);

            Time.run(done);
          });

          it('unsubscribes', done => {
            const Time = timeDriver(xs.empty());
            testUnsubscription(Time, Time.throttleAnimation, done);
          });
        });

        describe('.record', () => {
          it('records a stream into an array of entries', done => {
            const Time = mockTimeSource();

            const expectedNextEntry = {type: 'next', time: 60, value: 'a'};
            const expectedCompletionEntry = {type: 'complete', time: 140};

            const input$ = Time.diagram(`---a---|`);

            const actual$ = compose(
              input$,
              Time.record
            );
            const expected$ = Time.diagram(`x--y---(z|)`, {
              x: [],
              y: [expectedNextEntry],
              z: [expectedNextEntry, expectedCompletionEntry],
            });

            Time.assertEqual(actual$, expected$);

            Time.run(done);
          });

          it('records errors', done => {
            const Time = mockTimeSource();

            const expectedErrorEntry = {
              type: 'error',
              time: 60,
              error: new Error(`scheduled error`),
            };

            const input$ = Time.diagram(`---#`);

            const actual$ = compose(
              input$,
              Time.record
            );
            const expected$ = Time.diagram(`x--(y|)`, {
              x: [],
              y: [expectedErrorEntry],
            });

            Time.assertEqual(actual$, expected$);

            Time.run(done);
          });
        });
      });
    });
  });
});
