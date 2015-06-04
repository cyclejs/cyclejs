'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/core/cycle');
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
    Array.prototype.slice.call(document.querySelectorAll('.cycletest'))
      .forEach(function (x) {
        if (x.remove) {
          x.remove();
        }
      });
  });

  describe('makeDOMAdapter', function () {
    it('should accept a DOM element as input', function () {
      let element = createRenderTarget();
      assert.doesNotThrow(function () {
        Cycle.makeDOMAdapter(element);
      });
    });

    it('should accept a DocumentFragment as input', function () {
      let element = document.createDocumentFragment();
      assert.doesNotThrow(function () {
        Cycle.makeDOMAdapter(element);
      });
    });

    it('should accept a string selector to an existing element as input', function () {
      let id = 'testShouldAcceptSelectorToExisting';
      let element = createRenderTarget();
      element.id = id;
      assert.doesNotThrow(function () {
        Cycle.makeDOMAdapter('#' + id);
      });
    });

    it('should not accept a selector to an unknown element as input', function () {
      assert.throws(function () {
        Cycle.makeDOMAdapter('#nonsenseIdToNothing');
      }, /Cannot render into unknown element/);
    });

    it('should not accept a number as input', function () {
      assert.throws(function () {
        Cycle.makeDOMAdapter(123);
      }, /Given container is not a DOM element neither a selector string/);
    });
  });

  describe('DOMAdapter', function () {
    it('should throw if input is not an Observable<VTree>', function () {
      let domAdapter = Cycle.makeDOMAdapter(createRenderTarget());
      assert.throws(function () {
        domAdapter({});
      }, /The DOMAdapter function expects as input an Observable of virtual/);
    });

    it('should convert a simple virtual-dom <select> to DOM element', function () {
      function app() {
        return {
          dom: Rx.Observable.just(h('select.my-class', [
            h('option', {value: 'foo'}, 'Foo'),
            h('option', {value: 'bar'}, 'Bar'),
            h('option', {value: 'baz'}, 'Baz')
          ]))
        };
      }
      let [left, right] = Cycle.run(app, {
        dom: Cycle.makeDOMAdapter(createRenderTarget())
      });
      let selectEl = document.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      right.dispose();
    });

    it('should catch interaction events coming from wrapped View', function (done) {
      // Make a View reactively imitating another View
      function app() {
        return {
          dom: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [appOutput, adaptersOutput] = Cycle.run(app, {
        dom: Cycle.makeDOMAdapter(createRenderTarget())
      });
      adaptersOutput.get('dom', '.myelementclass', 'click').subscribe(ev => {
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
      adaptersOutput.dispose();
    });

    it('should allow subscribing to interactions', function (done) {
      // Make a View reactively imitating another View
      function app() {
        return {
          dom: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [appOutput, adaptersOutput] = Cycle.run(app, {
        dom: Cycle.makeDOMAdapter(createRenderTarget())
      });
      adaptersOutput.get('dom', '.myelementclass', 'click').subscribe(ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.innerHTML, 'Foobar');
        adaptersOutput.dispose();
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
      //Cycle.registerCustomElement('myelement', Fixture89.myelement);
      function app() {
        let number$ = Fixture89.makeModelNumber$();
        return {
          dom: Fixture89.viewWithContainerFn(number$)
        };
      }
      let [appOutput, adaptersOutput] = Cycle.run(app, {
        dom: Cycle.makeDOMAdapter(createRenderTarget(), {
          'my-element': Fixture89.myElement
        })
      });

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
        adaptersOutput.dispose();
        done();
      }, 500);
    });

    it.skip('should not work after has been disposed', function (done) {
      assert.fail(); // TODO
    });

    it('should reject a view with custom element as the root of vtree$', function (done) {
      function app() {
        let number$ = Fixture89.makeModelNumber$();
        return {
          dom: Fixture89.viewWithoutContainerFn(number$)
        };
      }
      let [appOutput, adaptersOutput] = Cycle.run(app, {
        dom: Cycle.makeDOMAdapter(createRenderTarget(), {
          'my-element': Fixture89.myElement
        })
      });
      let observer = Rx.Observer.create(
        () => {},
        (err) => {
          let errMsg = 'Illegal to use a Cycle custom element as the root of a View.';
          assert.strictEqual(err.message, errMsg);
          adaptersOutput.dispose();
          done();
        }
      );
      adaptersOutput.get('dom', ':root').subscribe(observer);
    });
  });
});
