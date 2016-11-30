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
    try {
      time.assertEqual(
        value,
        expected,
        () => done(new Error(`test unexpectedly did not fail`))
      );

      time.run();

    } catch (e) {
      // generates an error message
      done();
    }
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
      `------1---2----|`
    );

    const value = input.compose(time.delay(60));

    time.assertEqual(
      value,
      expected,
      done
    );

    time.run();
  });
});
