'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/cycle');
let DOMUser = require('../../src/dom-user');
let Fixture89 = require('./fixtures/issue-89');
let {Rx, h} = Cycle;

function createDOMUser() {
  var element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return Cycle.createDOMUser(element);
}

describe('DOM User', function () {
  beforeEach(function () {
    DOMUser._customElements = null;
    var testDivs = Array.prototype.slice.call(document.querySelectorAll('.cycletest'));
    testDivs.forEach(function (x) {
      if (x.remove) { x.remove(); }
    });
  });

  describe('Cycle.createDOMUser', function () {
    it('should accept a DOM element as input', function () {
      var element = document.createElement('div');
      element.className = 'cycletest';
      assert.doesNotThrow(function () {
        Cycle.createDOMUser(element);
      });
    });

    it('should accept a DocumentFragment as input', function () {
      var element = document.createDocumentFragment();
      assert.doesNotThrow(function () {
        Cycle.createDOMUser(element);
      });
    });

    it('should accept a string selector to an existing element as input', function () {
      var id = 'testShouldAcceptSelectorToExisting';
      var element = document.createElement('div');
      element.className = 'cycletest';
      element.id = id;
      document.body.appendChild(element);
      assert.doesNotThrow(function () {
        Cycle.createDOMUser('#' + id);
      });
    });

    it('should not accept a selector to an unknown element as input', function () {
      assert.throws(function () {
        Cycle.createDOMUser('#nonsenseIdToNothing');
      }, /Cannot render into unknown element/);
    });

    it('should not accept a number as input', function () {
      assert.throws(function () {
        Cycle.createDOMUser(123);
      }, /Given container is not a DOM element neither a selector string/);
    });
  });

  describe('DOMUser', function () {
    it('should have `event$` function', function () {
      var user = createDOMUser();
      assert.strictEqual(typeof user.event$, 'function');
      assert.strictEqual(user.event$.length, 2);
    });

    it('should convert a simple virtual-dom <select> to DOM element', function () {
      var view = {
        vtree$: Rx.Observable.just(Cycle.h('select.my-class', [
          Cycle.h('option', {value: 'foo'}, 'Foo'),
          Cycle.h('option', {value: 'bar'}, 'Bar'),
          Cycle.h('option', {value: 'baz'}, 'Baz')
        ]))
      };
      var user = createDOMUser();
      user.inject(view);
      var selectEl = document.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
    });

    it('should catch interaction events coming from wrapped View', function (done) {
      var user = createDOMUser();
      // Make a View reactively imitating another View
      var view = Cycle.createView(function () {
        return {
          vtree$: Rx.Observable.just(
            Cycle.h('h3.myelementclass', 'Foobar')
          )
        };
      });
      var wrapperView = Cycle.createView(function (view) {
        return {
          vtree$: view.get('vtree$')
        };
      });
      user.event$('.myelementclass', 'click').subscribe(function (ev) {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.innerHTML, 'Foobar');
        done();
      });
      user.inject(wrapperView);
      wrapperView.inject(view);
      // Make assertions
      var myElement = document.querySelector('.myelementclass');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.doesNotThrow(function () {
        myElement.click();
      });
    });

    // TODO make this pass
    it.skip('should allow calling event$() after user was injected', function (done) {
      var user = createDOMUser();
      // Make a View reactively imitating another View
      var view = Cycle.createView(function () {
        return {
          vtree$: Rx.Observable.just(
            Cycle.h('h3.myelementclass', 'Foobar')
          )
        };
      });
      user.inject(view);
      user.event$('.myelementclass', 'click').subscribe(function (ev) {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.innerHTML, 'Foobar');
        done();
      });
      // Make assertions
      var myElement = document.querySelector('.myelementclass');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.doesNotThrow(function () {
        myElement.click();
      });
    });

    it('should accept a view wrapping a custom element (#89)', function (done) {
      Cycle.registerCustomElement('myelement', Fixture89.myelement);
      let model = Cycle.createModel(Fixture89.modelFn);
      let view = Cycle.createView(Fixture89.viewWithContainerFn);
      let user = createDOMUser();
      user.inject(view).inject(model);

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
        done();
      }, 300);
    });

    it('should accept a view with custom element at the root of vtree$', function (done) {
      Cycle.registerCustomElement('myelement', Fixture89.myelement);
      let model = Cycle.createModel(Fixture89.modelFn);
      let view = Cycle.createView(Fixture89.viewWithoutContainerFn);
      let user = createDOMUser();
      user.inject(view).inject(model);

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
        done();
      }, 300);
    });
  });
});
