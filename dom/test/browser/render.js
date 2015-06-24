'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/core');
let CycleWeb = require('../../src/cycle-web');
let Fixture89 = require('./fixtures/issue-89');
let {Rx} = Cycle;
let {h, makeDOMDriver} = CycleWeb;

function createRenderTarget() {
  let element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return element;
}

describe('Rendering', function () {
  beforeEach(function () {
    Array.prototype.slice.call(document.querySelectorAll('.cycletest'))
      .forEach(function (x) {
        if (x.remove) {
          x.remove();
        }
      });
  });

  describe('makeDOMDriver', function () {
    it('should accept a DOM element as input', function () {
      let element = createRenderTarget();
      assert.doesNotThrow(function () {
        makeDOMDriver(element);
      });
    });

    it('should accept a DocumentFragment as input', function () {
      let element = document.createDocumentFragment();
      assert.doesNotThrow(function () {
        makeDOMDriver(element);
      });
    });

    it('should accept a string selector to an existing element as input', function () {
      let id = 'testShouldAcceptSelectorToExisting';
      let element = createRenderTarget();
      element.id = id;
      assert.doesNotThrow(function () {
        makeDOMDriver('#' + id);
      });
    });

    it('should not accept a selector to an unknown element as input', function () {
      assert.throws(function () {
        makeDOMDriver('#nonsenseIdToNothing');
      }, /Cannot render into unknown element/);
    });

    it('should not accept a number as input', function () {
      assert.throws(function () {
        makeDOMDriver(123);
      }, /Given container is not a DOM element neither a selector string/);
    });
  });

  describe('DOM Driver', function () {
    it('should throw if input is not an Observable<VTree>', function () {
      let domDriver = makeDOMDriver(createRenderTarget());
      assert.throws(function () {
        domDriver({});
      }, /The DOM driver function expects as input an Observable of virtual/);
    });

    it('should have Observable `:root` in response', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(
            h('div.top-most', [
              h('p', 'Foo'),
              h('span', 'Bar')
            ])
          )
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').first().subscribe(root => {
        let classNameRegex = /top\-most/;
        assert.strictEqual(root.tagName, 'DIV');
        assert.notStrictEqual(classNameRegex.exec(root.className), null);
        assert.strictEqual(classNameRegex.exec(root.className)[0], 'top-most');
        responses.dispose();
        done();
      });
    });

    it('should convert a simple virtual-dom <select> to DOM element', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(h('select.my-class', [
            h('option', {value: 'foo'}, 'Foo'),
            h('option', {value: 'bar'}, 'Bar'),
            h('option', {value: 'baz'}, 'Baz')
          ]))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').first().subscribe(function () {
        let selectEl = document.querySelector('.my-class');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'SELECT');
        responses.dispose();
        done();
      });
    });

    it('should catch interaction events coming from wrapped View', function (done) {
      // Make a View reactively imitating another View
      function app() {
        return {
          DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      // Make assertions
      responses.DOM.get('.myelementclass', 'click').subscribe(ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.innerHTML, 'Foobar');
        responses.dispose();
        done();
      });
      responses.DOM.get(':root').first().subscribe(function () {
        let myElement = document.querySelector('.myelementclass');
        assert.notStrictEqual(myElement, null);
        assert.notStrictEqual(typeof myElement, 'undefined');
        assert.strictEqual(myElement.tagName, 'H3');
        assert.doesNotThrow(function () {
          myElement.click();
        });
      });
    });

    it('should allow subscribing to interactions', function (done) {
      // Make a View reactively imitating another View
      function app() {
        return {
          DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get('.myelementclass', 'click').subscribe(ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.innerHTML, 'Foobar');
        responses.dispose();
        done();
      });
      // Make assertions
      responses.DOM.get(':root').first().subscribe(function () {
        let myElement = document.querySelector('.myelementclass');
        assert.notStrictEqual(myElement, null);
        assert.notStrictEqual(typeof myElement, 'undefined');
        assert.strictEqual(myElement.tagName, 'H3');
        assert.doesNotThrow(function () {
          myElement.click();
        });
      });
    });

    it('should accept a view wrapping a custom element (#89)', function (done) {
      function app() {
        let number$ = Fixture89.makeModelNumber$();
        return {
          DOM: Fixture89.viewWithContainerFn(number$)
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget(), {
          'my-element': Fixture89.myElement
        })
      });

      responses.DOM.get(':root').first().subscribe(function () {
        setTimeout(() => {
          let myelement = document.querySelector('.myelementclass');
          assert.notStrictEqual(myelement, null);
          assert.strictEqual(myelement.tagName, 'H3');
          assert.strictEqual(myelement.innerHTML, '123');
        }, 100);
        setTimeout(() => {
          let myelement = document.querySelector('.myelementclass');
          assert.notStrictEqual(myelement, null);
          assert.strictEqual(myelement.tagName, 'H3');
          assert.strictEqual(myelement.innerHTML, '456');
          responses.dispose();
          done();
        }, 500);
      });
    });

    it('should reject a view with custom element as the root of vtree$', function (done) {
      function app() {
        let number$ = Fixture89.makeModelNumber$();
        return {
          DOM: Fixture89.viewWithoutContainerFn(number$)
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget(), {
          'my-element': Fixture89.myElement
        })
      });
      responses.DOM.get(':root').subscribeOnError(function (err) {
        assert.strictEqual(err.message,
          'Illegal to use a Cycle custom element as the root of a View.'
        );
        responses.dispose();
        done();
      });
    });

    it('should not work after has been disposed', function (done) {
      let number$ = Rx.Observable.range(1, 3)
        .concatMap(x => Rx.Observable.just(x).delay(50));
      function app() {
        return {
          DOM: number$.map(number =>
              h('h3.target', String(number))
          )
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').subscribe(function () {
        let selectEl = document.querySelector('.target');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'H3');
        assert.notStrictEqual(selectEl.innerHTML, '3');
        if (selectEl.innerHTML === '2') {
          responses.dispose();
          done();
        }
      });
    });
  });
});
