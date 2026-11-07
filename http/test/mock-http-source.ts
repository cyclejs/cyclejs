import * as assert from 'assert';
import xs from 'xstream';
import {from, of} from 'rxjs';
import {mergeAll} from 'rxjs/operators';
import {setAdapt} from '@cycle/run/lib/adapt';
import {mockHTTPSource, RequestInput, RequestOptions} from '../src/index';
import {mockHTTPSource as mockRxHTTP} from '../src/rxjs';
import * as most from 'most';
import {mockHTTPSource as mockMostHTTP} from '../src/most';

export function runMockHTTPSourceTests() {
  describe('mockHTTPSource', () => {
    beforeEach(() => setAdapt(stream => stream));
    // The containing Node suite uses the RxJS runner.
    afterEach(() => setAdapt(from as any));

    it('preserves outer errors', done => {
      const failure = new Error('mock outer failed');
      mockHTTPSource({a: xs.throw(failure)})
        .select()
        .addListener({
          next: () => assert.fail('Unexpected response stream'),
          error: error => {
            assert.strictEqual(error, failure);
            done();
          },
          complete: () => assert.fail('Expected outer error'),
        });
    });

    it('ignores unknown categories in a nonempty configuration', done => {
      mockHTTPSource({a: xs.of(xs.of({}))})
        .select('missing')
        .addListener({
          next: () => assert.fail('Unexpected category'),
          error: done,
          complete: done,
        });
    });

    it('adapts both outer and inner streams for the Most entrypoint', done => {
      setAdapt(stream => most.from(stream as any));
      const value = {body: 'most'};
      mockMostHTTP({a: most.of(most.of(value))})
        .select('a')
        .join()
        .observe(response => {
          assert.strictEqual(response, value);
        })
        .then(done, done);
    });

    it('selects a category and preserves response identity', done => {
      const value = {body: {answer: 42}};
      const source = mockHTTPSource({
        answer: xs.of(xs.of(value)),
        other: xs.of(xs.of({})),
      });
      source.select('answer').addListener({
        next: response =>
          response.addListener({
            next: result => assert.strictEqual(result, value),
            error: done,
            complete: done,
          }),
        error: done,
        complete: () => {},
      });
    });

    it('selects all categories and marks the adapted source for devtools', done => {
      const stream = mockHTTPSource({
        a: xs.of(xs.of({})),
        b: xs.of(xs.of({})),
      }).select();
      assert.strictEqual((stream as any)._isCycleSource, 'MockedHTTP');
      const categories: Array<string | undefined> = [];
      stream.addListener({
        next: response => categories.push(response.request.category),
        error: done,
        complete: () => {
          assert.deepStrictEqual(categories.sort(), ['a', 'b']);
          done();
        },
      });
    });

    it('completes empty configurations and unknown categories without values', done => {
      let count = 0;
      mockHTTPSource({})
        .select('missing')
        .addListener({
          next: () => count++,
          error: done,
          complete: () => {
            assert.strictEqual(count, 0);
            done();
          },
        });
    });

    it('filters request metadata without mutating the input response stream', done => {
      const input = xs.of({body: 'ok'}).remember() as any;
      const request: RequestOptions = {url: '/answer', category: 'original'};
      Object.defineProperty(input, 'request', {
        value: request,
        writable: false,
      });
      const source = mockHTTPSource({answer: xs.of(input)}).filter(
        req => req.url === '/answer'
      );
      source.select('answer').addListener({
        next: response => {
          assert.notStrictEqual(response, input);
          assert.notStrictEqual(response.request, request);
          assert.strictEqual(response.request.category, 'answer');
          assert.strictEqual(input.request.category, 'original');
        },
        error: done,
        complete: done,
      });
    });

    it('reuses source and sink isolation including nested namespaces', done => {
      const input = xs.of({}) as any;
      input.request = {url: '/scoped', _namespace: ['parent', 'child']};
      const source = mockHTTPSource({scoped: xs.of(input)});
      const parent = source.isolateSource(source, 'parent');
      const child = parent.isolateSource(parent, 'child');
      let count = 0;
      child.select('scoped').addListener({
        next: () => count++,
        error: done,
        complete: () => {
          assert.strictEqual(count, 1);
          done();
        },
      });
      assert.strictEqual(source.isolateSource(source, null as any), source);
      source.isolateSink(xs.of<RequestInput>('/scoped'), 'parent').addListener({
        next: request =>
          assert.deepStrictEqual(request, {
            url: '/scoped',
            _namespace: ['parent'],
          }),
        error: error => {
          throw error;
        },
        complete: () => {},
      });
    });

    it('preserves inner errors without turning them into outer failures', done => {
      const failure = new Error('mock response failed');
      let innerFailed = false;
      mockHTTPSource({a: xs.of(xs.throw(failure))})
        .select()
        .addListener({
          next: response =>
            response.addListener({
              next: () => assert.fail('Unexpected response'),
              error: error => {
                assert.strictEqual(error, failure);
                innerFailed = true;
              },
              complete: () => {},
            }),
          error: done,
          complete: () => {
            assert.strictEqual(innerFailed, true);
            done();
          },
        });
    });

    it('adapts both outer and inner streams for the RxJS entrypoint', done => {
      setAdapt(from as any);
      const value = {body: 'rxjs'};
      mockRxHTTP({a: of(of(value))})
        .select('a')
        .pipe(mergeAll())
        .subscribe({
          next: response => assert.strictEqual(response, value),
          error: done,
          complete: done,
        });
    });

    it('does not subscribe to supplied responses until selected output is observed', done => {
      let starts = 0;
      const input = xs.create<any>({
        start: listener => {
          starts++;
          listener.complete();
        },
        stop: () => {},
      });
      const source = mockHTTPSource({a: input});
      assert.strictEqual(starts, 0);
      source.select().addListener({
        next: () => {},
        error: done,
        complete: () => {
          assert.strictEqual(starts, 1);
          done();
        },
      });
    });
  });
}
