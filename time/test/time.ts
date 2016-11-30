import * as assert from 'assert';
import makeTimeDriver from '../src/time-driver';

describe("time", () => {
  it("allows testing via marble diagrams", (done) => {
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
          done();
        } else {
          throw new Error('expected test to fail');
        }
      }
    );

    time.run();
  });

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

  it("handles delays", (done) => {
    const time = makeTimeDriver()();

    const input = time.diagram(
      `---1---2-------|`
    );

    const expected = time.diagram(
      `------1---2-------|`
    );

    const value = input.compose(time.delay(60));

    time.assertEqual(
      value,
      expected,
      done
    );

    time.run();
  });

  it("has an interval operator", (done) => {
    const time = makeTimeDriver()();

    const stream = time.interval(80);

    const expected = time.diagram(
      `---0---1---2---3---4---|`
    );

    time.assertEqual(
      stream.take(6),
      expected,
      done
    );

    time.run();
  });

  it("has a debounce operator", (done) => {
    const time = makeTimeDriver()();

    const input =    `--1----2-3----|`
    const expected = `-----1------3-|`

    const stream = time.diagram(input).compose(time.debounce(60));
    const expectedStream = time.diagram(expected);

    time.assertEqual(
      stream,
      expectedStream,
      done
    );

    time.run();
  });
});
