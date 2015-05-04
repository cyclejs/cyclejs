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

  describe('Cycle.applyToDOM', function () {
    it('should accept a DOM element as input', function () {
      let element = createRenderTarget();
      let subscription;
      assert.doesNotThrow(function () {
        subscription = Cycle.applyToDOM(element, () => Rx.Observable.empty());
      });
      subscription.dispose();
    });

    it('should accept a DocumentFragment as input', function () {
      let element = document.createDocumentFragment();
      let subscription;
      assert.doesNotThrow(function () {
        subscription = Cycle.applyToDOM(element, () => Rx.Observable.empty());
      });
      subscription.dispose();
    });

    it('should accept a string selector to an existing element as input', function () {
      let id = 'testShouldAcceptSelectorToExisting';
      let element = createRenderTarget();
      element.id = id;
      let subscription;
      assert.doesNotThrow(function () {
        subscription = Cycle.applyToDOM('#' + id, () => Rx.Observable.empty());
      });
      subscription.dispose();
    });

    it('should not accept a selector to an unknown element as input', function () {
      assert.throws(function () {
        Cycle.applyToDOM('#nonsenseIdToNothing', () => Rx.Observable.empty());
      }, /Cannot render into unknown element/);
    });

    it('should not accept a number as input', function () {
      assert.throws(function () {
        Cycle.applyToDOM(123);
      }, /Given container is not a DOM element neither a selector string/);
    });

    it('should convert a simple virtual-dom <select> to DOM element', function () {
      let vtree$ = Rx.Observable.just(h('select.my-class', [
        h('option', {value: 'foo'}, 'Foo'),
        h('option', {value: 'bar'}, 'Bar'),
        h('option', {value: 'baz'}, 'Baz')
      ]));
      let subscription = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
      let selectEl = document.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      subscription.dispose();
    });

    it('should catch interaction events coming from wrapped View', function (done) {
      // Make a View reactively imitating another View
      let vtree$ = Rx.Observable.just(h('h3.myelementclass', 'Foobar'));
      let wrapper$ = vtree$.flatMap(vtree => Rx.Observable.just(vtree));
      let subscription = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
      subscription.interactions.get('.myelementclass', 'click').subscribe(ev => {
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
      subscription.dispose();
    });

    it('should allow subscribing to interactions', function (done) {
      // Make a View reactively imitating another View
      let vtree$ = Rx.Observable.just(h('h3.myelementclass', 'Foobar'));
      let subscription = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
      subscription.interactions.get('.myelementclass', 'click').subscribe(ev => {
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
      let vtree$ = Fixture89.viewWithContainerFn(number$);
      let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);

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
        domUI.dispose();
        done();
      }, 500);
    });

    it('should reject a view with custom element as the root of vtree$', function (done) {
      Cycle.registerCustomElement('myelement', Fixture89.myelement);
      let number$ = Fixture89.makeModelNumber$();
      let vtree$ = Fixture89.viewWithoutContainerFn(number$);
      let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);

      domUI.rootElem$.subscribe(() => {}, (err) => {
        let errMsg = 'Illegal to use a Cycle custom element as the root of a View.';
        assert.strictEqual(err.message, errMsg);
        domUI.dispose();
        done();
      });
    });
  });
});
