import * as assert from 'assert';
import xs from 'xstream';
import {mockHTTPSource} from '../src/mockHTTPSource';

function flattenTo(selectResult: any): any {
  return (selectResult as any).flatten();
}

describe('mockHTTPSource', function() {
  it('should be accessible in the API', function() {
    assert.strictEqual(typeof mockHTTPSource, 'function');
  });

  it('should emit configured responses for a category', function(done) {
    const response$ = xs.of({data: {some: 'thing'}} as any);
    const HTTP = mockHTTPSource({categoryName: xs.of(response$) as any});

    const received: Array<any> = [];
    flattenTo(HTTP.select('categoryName')).addListener({
      next: (res: any) => received.push(res),
      error: done,
      complete: () => {
        assert.strictEqual(received.length, 1);
        assert.deepStrictEqual(received[0].data, {some: 'thing'});
        done();
      },
    });
  });

  it('should attach the request category to response streams', function(done) {
    const response$ = xs.of({data: {some: 'thing'}} as any);
    const HTTP = mockHTTPSource({categoryName: xs.of(response$) as any});

    const seen: Array<any> = [];
    flattenTo(
      HTTP.filter(req => {
        seen.push(req.category);
        return true;
      }).select()
    ).addListener({
      next: () => {},
      error: done,
      complete: () => {
        assert.deepStrictEqual(seen, ['categoryName']);
        done();
      },
    });
  });

  it('should emit nothing for an unknown category', function(done) {
    const response$ = xs.of({data: {some: 'thing'}} as any);
    const HTTP = mockHTTPSource({categoryName: xs.of(response$) as any});

    const received: Array<any> = [];
    flattenTo(HTTP.select('other')).addListener({
      next: (res: any) => received.push(res),
      error: done,
      complete: () => {
        assert.strictEqual(received.length, 0);
        done();
      },
    });
  });

  it('should support select() without arguments', function(done) {
    const response$ = xs.of({data: {some: 'thing'}} as any);
    const HTTP = mockHTTPSource({categoryName: xs.of(response$) as any});

    const received: Array<any> = [];
    flattenTo(HTTP.select()).addListener({
      next: (res: any) => received.push(res),
      error: done,
      complete: () => {
        assert.strictEqual(received.length, 1);
        done();
      },
    });
  });

  it('should support filter() by request', function(done) {
    const responseA$ = xs.of({data: 'a'} as any);
    const responseB$ = xs.of({data: 'b'} as any);
    const HTTP = mockHTTPSource({
      catA: xs.of(responseA$) as any,
      catB: xs.of(responseB$) as any,
    });

    const received: Array<any> = [];
    flattenTo(
      HTTP.filter(req => req.category === 'catB').select()
    ).addListener({
      next: (res: any) => received.push(res),
      error: done,
      complete: () => {
        assert.strictEqual(received.length, 1);
        assert.strictEqual(received[0].data, 'b');
        done();
      },
    });
  });

  it('should complete immediately with an empty config', function(done) {
    const HTTP = mockHTTPSource({});
    const received: Array<any> = [];
    flattenTo(HTTP.select()).addListener({
      next: (res: any) => received.push(res),
      error: done,
      complete: () => {
        assert.strictEqual(received.length, 0);
        done();
      },
    });
  });
});
