'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../../src/cycle');
let {Rx, h} = Cycle;

describe('Injection', function () {
  it('should correctly propagate data along streams', function (done) {
    let m$ = Rx.Observable.just(2);
    let v$ = Cycle.createStream(function (m$) {
      return m$.map(x => x * 3);
    });
    let i$ = Cycle.createStream(function (v$) {
      return v$.map(x => x * 5);
    });
    i$.subscribe(function (x) {
      assert.strictEqual(x, 30);
      done();
    });
    i$.inject(v$).inject(m$);
  });

  it('should propagate delayed intent event up until view', function (done) {
    let m$ = Cycle.createStream(function (i$) {
      return i$.startWith(2);
    });
    let v$ = Cycle.createStream(function (m$) {
      return m$.map(x => x * 3);
    });
    let i$ = Rx.Observable.just(20).delay(200);
    v$.skip(1).subscribe(function (x) {
      assert.strictEqual(x, 60);
      done();
    });
    v$.inject(m$).inject(i$);
  });

  it('should handle 4 streams injected in sequence', function (done) {
    let one$ = Rx.Observable.just(2);
    let two$ = Cycle.createStream(function (one$) {
      return one$.map(x => x * 3);
    });
    let three$ = Cycle.createStream(function (two$) {
      return two$.map(x => x * 5);
    });
    let four$ = Cycle.createStream(function (three$) {
      return three$.map(x => x * 7);
    });
    four$.subscribe(function (x) {
      assert.strictEqual(x, 210);
      done();
    });
    four$.inject(three$).inject(two$).inject(one$);
  });

  it('should handle 5 streams injected in sequence', function (done) {
    let one$ = Rx.Observable.just(2);
    let two$ = Cycle.createStream(function (one$) {
      return one$.map(x => x * 3);
    });
    let three$ = Cycle.createStream(function (two$) {
      return two$.map(x => x * 5);
    });
    let four$ = Cycle.createStream(function (three$) {
      return three$.map(x => x * 7);
    });
    let five$ = Cycle.createStream(function (four$) {
      return four$.map(x => x * 11);
    });
    five$.subscribe(function (x) {
      assert.strictEqual(x, 2310);
      done();
    });
    five$.inject(four$).inject(three$).inject(two$).inject(one$);
  });

  it('should handle 6 streams injected in sequence', function (done) {
    let one$ = Rx.Observable.just(2);
    let two$ = Cycle.createStream(function (one$) {
      return one$.map(x => x * 3);
    });
    let three$ = Cycle.createStream(function (two$) {
      return two$.map(x => x * 5);
    });
    let four$ = Cycle.createStream(function (three$) {
      return three$.map(x => x * 7);
    });
    let five$ = Cycle.createStream(function (four$) {
      return four$.map(x => x * 11);
    });
    let six$ = Cycle.createStream(function (five$) {
      return five$.map(x => x * 13);
    });
    six$.subscribe(function (x) {
      assert.strictEqual(x, 30030);
      done();
    });
    six$.inject(five$).inject(four$).inject(three$).inject(two$).inject(one$);
  });

  it('vtree$ needs replay/connect if we subscribe after injection', function (done) {
    let m$ = Rx.Observable.just(2);
    let vtree$ = Cycle.createStream(function (m$) {
      // shareReplay(1) not enough, replay(null,1) and connect() needed
      let vtree$ = m$.map(x => h('div', String(x))).replay(null, 1);
      vtree$.connect();
      return vtree$;
    });
    let v$ = Cycle.createStream(function (m$) {
      return m$.map(x => x * 3);
    });
    let i$ = Cycle.createStream(function (v$) {
      return v$.map(x => x * 5);
    });
    i$.inject(v$).inject(m$);
    vtree$.inject(m$);
    vtree$.subscribe(function (x) {
      assert.strictEqual(x.type, 'VirtualNode');
      done();
    });
  });
});
