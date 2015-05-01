'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/cycle');
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
      assert.doesNotThrow(function () {
        Cycle.render(Rx.Observable.empty(), element);
      });
    });

    it('should accept a DocumentFragment as input', function () {
      let element = document.createDocumentFragment();
      assert.doesNotThrow(function () {
        Cycle.render(Rx.Observable.empty(), element);
      });
    });

    it('should accept a string selector to an existing element as input', function () {
      let id = 'testShouldAcceptSelectorToExisting';
      let element = createRenderTarget();
      element.id = id;
      assert.doesNotThrow(function () {
        Cycle.render(Rx.Observable.empty(), '#' + id);
      });
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

  describe('reactiveNode', function () {
    it('should have `interactions` object', function () {
      let reactiveNode = Cycle.render(Rx.Observable.empty(), createRenderTarget());
      assert.strictEqual(typeof reactiveNode.interactions, 'object');
      assert.strictEqual(typeof reactiveNode.interactions.choose, 'function');
      assert.strictEqual(reactiveNode.interactions.choose.length, 2);
    });

    it('should convert a simple virtual-dom <select> to DOM element', function (done) {
      let vtree$ = Rx.Observable.just(h('select.my-class', [
        h('option', {value: 'foo'}, 'Foo'),
        h('option', {value: 'bar'}, 'Bar'),
        h('option', {value: 'baz'}, 'Baz')
      ]));
      let reactiveNode = Cycle.render(vtree$, createRenderTarget());

      reactiveNode.rootElem$.subscribe(function () {
        let selectEl = document.querySelector('.my-class');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'SELECT');
      }, null, done);

      reactiveNode.connect();
    });

    it('should catch interaction events', function (done) {
      let vtree$ = Rx.Observable.just(h('h3.myelementclass', 'Foobar'));
      let reactiveNode = Cycle.render(vtree$, createRenderTarget());

      reactiveNode.interactions
        .choose('.myelementclass', 'click')
        .take(1)
        .subscribe(function (ev) {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.innerHTML, 'Foobar');
        }, null, done);

      reactiveNode.rootElem$.subscribe(function () {
        let myElement = document.querySelector('.myelementclass');
        assert.notStrictEqual(myElement, null);
        assert.notStrictEqual(typeof myElement, 'undefined');
        assert.strictEqual(myElement.tagName, 'H3');
        assert.doesNotThrow(function () {
          myElement.click();
        });
      });

      reactiveNode.connect();
    });

    it('should accept a view wrapping a custom element (#89)', function () {
      let customElements = new Cycle.CustomElementsRegistry();
      customElements.registerCustomElement('myelement', Fixture89.myelement);
      let number$ = Fixture89.makeModelNumber$();
      let vtree$ = Fixture89.viewWithContainerFn(number$);
      let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);

      reactiveNode.connect();

      number$.request(1);

      let myelement = document.querySelector('.myelementclass');
      assert.notStrictEqual(myelement, null);
      assert.strictEqual(myelement.tagName, 'H3');
      assert.strictEqual(myelement.innerHTML, '123');

      number$.request(1);

      let myelement2 = document.querySelector('.myelementclass');
      assert.notStrictEqual(myelement2, null);
      assert.strictEqual(myelement2.tagName, 'H3');
      assert.strictEqual(myelement2.innerHTML, '456');
    });

    it('should reject a view with custom element as the root of vtree$', function () {
      let customElements = new Cycle.CustomElementsRegistry();
      customElements.registerCustomElement('myelement', Fixture89.myelement);
      let number$ = Fixture89.makeModelNumber$();
      let vtree$ = Fixture89.viewWithoutContainerFn(number$);
      let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);

      assert.throws(() => {
        reactiveNode.connect();
        number$.request(1);
      }, (err) => {
        let errMsg = 'Illegal to use a Cycle custom element as the root of a View.';
        return err.message === errMsg;
      });
    });
  });
});
