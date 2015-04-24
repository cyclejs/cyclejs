'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/cycle');
let CustomElements = require('../../src/rendering/custom-elements');
let Fixture89 = require('./fixtures/issue-89');
let {Rx, h} = Cycle;

function createRenderTarget() {
  let element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return element;
}

describe('Rendering', function () {
  beforeEach(function () {
    CustomElements.unregisterAllCustomElements();
    let testDivs = Array.prototype.slice.call(document.querySelectorAll('.cycletest'));
    testDivs.forEach(function (x) {
      if (x.remove) {
        x.remove();
      }
    });
  });

  describe('Cycle.render', function () {
    it('should accept a DOM element as input', function () {
      let element = createRenderTarget();
      let rootElem$;
      assert.doesNotThrow(function () {
        rootElem$ = Cycle.render(Rx.Observable.empty(), element);
      });
      rootElem$.dispose();
    });

    it('should accept a DocumentFragment as input', function () {
      let element = document.createDocumentFragment();
      let rootElem$;
      assert.doesNotThrow(function () {
        rootElem$ = Cycle.render(Rx.Observable.empty(), element);
      });
      rootElem$.dispose();
    });

    it('should accept a string selector to an existing element as input', function () {
      let id = 'testShouldAcceptSelectorToExisting';
      let element = createRenderTarget();
      element.id = id;
      let rootElem$;
      assert.doesNotThrow(function () {
        rootElem$ = Cycle.render(Rx.Observable.empty(), '#' + id);
      });
      rootElem$.dispose();
    });

    it('should not accept a selector to an unknown element as input', function () {
      assert.throws(function () {
        Cycle.render(Rx.Observable.empty(), '#nonsenseIdToNothing');
      }, /Cannot render into unknown element/);
    });

    it('should not accept a number as input', function () {
      assert.throws(function () {
        Cycle.render(123);
      }, /Given container is not a DOM element neither a selector string/);
    });
  });

  describe('rootElem$', function () {
    it('should have `interaction$` stream', function () {
      let rootElem$ = Cycle.render(Rx.Observable.empty(), createRenderTarget());
      assert.strictEqual(typeof rootElem$.interaction$, 'object');
      assert.strictEqual(typeof rootElem$.interaction$.subscribe, 'function');
      assert.strictEqual(typeof rootElem$.interaction$.choose, 'function');
      assert.strictEqual(rootElem$.interaction$.choose.length, 2);
      rootElem$.dispose();
    });

    it('should convert a simple virtual-dom <select> to DOM element', function () {
      let vtree$ = Rx.Observable.just(h('select.my-class', [
        h('option', {value: 'foo'}, 'Foo'),
        h('option', {value: 'bar'}, 'Bar'),
        h('option', {value: 'baz'}, 'Baz')
      ]));
      let rootElem$ = Cycle.render(vtree$, createRenderTarget());
      let selectEl = document.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      rootElem$.dispose();
    });

    it('should catch interaction events coming from wrapped View', function (done) {
      // Make a View reactively imitating another View
      let vtree$ = Rx.Observable.just(h('h3.myelementclass', 'Foobar'));
      let wrapper$ = Cycle.createStream(function (vtree$) {
        // TODO these tests should not require shareReplay(1)! Remove and fix src/
        return vtree$.shareReplay(1);
      });
      let rootElem$ = Cycle.createStream(function (vtree$) {
        return Cycle.render(vtree$, createRenderTarget());
      });
      rootElem$.interaction$.choose('.myelementclass', 'click').subscribe(function (ev) {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.innerHTML, 'Foobar');
        done();
      });
      rootElem$
        .inject(wrapper$)
        .inject(vtree$);
      // Make assertions
      let myElement = document.querySelector('.myelementclass');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.doesNotThrow(function () {
        myElement.click();
      });
      rootElem$.dispose();
    });

    it('should allow subscribing to interaction$ after injection', function (done) {
      let rootElem$ = Cycle.createStream(function (vtree$) {
        return Cycle.render(vtree$, createRenderTarget());
      });
      // Make a View reactively imitating another View
      let vtree$ = Rx.Observable.just(h('h3.myelementclass', 'Foobar'));
      rootElem$.inject(vtree$);
      rootElem$.interaction$.choose('.myelementclass', 'click').subscribe(function (ev) {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.innerHTML, 'Foobar');
        done();
      });
      // Make assertions
      let myElement = document.querySelector('.myelementclass');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.doesNotThrow(function () {
        myElement.click();
      });
    });

    it('should accept a view wrapping a custom element (#89)', function (done) {
      Cycle.registerCustomElement('myelement', Fixture89.myelement);
      let number$ = Fixture89.makeModelNumber$();
      // TODO these tests should not require shareReplay(1)! Remove and fix src/
      let vtree$ = Fixture89.viewWithContainerFn(number$).shareReplay(1);
      let rootElem$ = Cycle.render(vtree$, createRenderTarget());

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
        rootElem$.dispose();
        done();
      }, 300);
    });

    it('should reject a view with custom element as the root of vtree$', function (done) {
      Cycle.registerCustomElement('myelement', Fixture89.myelement);
      let number$ = Fixture89.makeModelNumber$();
      // TODO these tests should not require shareReplay(1)! Remove and fix src/
      let vtree$ = Fixture89.viewWithoutContainerFn(number$).shareReplay(1);
      let rootElem$ = Cycle.createStream(function (vtree$) {
        return Cycle.render(vtree$, createRenderTarget());
      });

      rootElem$.subscribe(() => {}, (err) => {
        let errMsg = 'Illegal to use a Cycle custom element as the root of a View.';
        assert.strictEqual(err.message, errMsg);
        rootElem$.dispose();
        done();
      });
      rootElem$.inject(vtree$);
    });
  });
});
