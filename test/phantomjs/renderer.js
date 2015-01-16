'use strict';
/* global describe, it, beforeEach */
var assert = require('assert');
var Cycle = require('../../src/cycle');
var Rx = Cycle.Rx;

function createRenderer() {
  var element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return Cycle.createRenderer(element);
}

function click(element) {
  var ev = document.createEvent('MouseEvent');
  ev.initMouseEvent(
    'click',
    true /* bubble */, true /* cancelable */,
    window, null,
    0, 0, 0, 0, /* coordinates */
    false, false, false, false, /* modifier keys */
    0 /*left*/, null
  );
  element.dispatchEvent(ev);
};

describe('DOM Rendering', function () {
  this.timeout(6000);

  beforeEach(function () {
    Cycle._customElements = null;
    var testDivs = Array.prototype.slice.call(document.querySelectorAll('.cycletest'));
    testDivs.forEach(function (x) {
      if (x.remove) { x.remove(); }
    });
  });

  describe('Cycle.createRenderer', function () {
    it('should accept a DOM element as input', function () {
      var element = document.createElement('div');
      element.className = 'cycletest';
      assert.doesNotThrow(function () {
        Cycle.createRenderer(element);
      });
    });

    it('should accept a string selector to an existing element as input', function () {
      var id = 'testShouldAcceptSelectorToExisting';
      var element = document.createElement('div');
      element.className = 'cycletest';
      element.id = id;
      document.body.appendChild(element);
      assert.doesNotThrow(function () {
        Cycle.createRenderer('#' + id);
      });
    });

    it('should not accept a selector to an unknown element as input', function () {
      assert.throws(function () {
        Cycle.createRenderer('#nonsenseIdToNothing');
      }, /Cannot render into unknown element/);
    });

    it('should not accept a number as input', function () {
      assert.throws(function () {
        Cycle.createRenderer(123);
      }, /Given container is not a DOM element neither a selector string/);
    });
  });

  describe('Renderer', function () {
    it('should convert a simple virtual-dom <select> to DOM element', function () {
      var view = {
        vtree$: Rx.Observable.just(Cycle.h('select.my-class', [
          Cycle.h('option', {value: 'foo'}, 'Foo'),
          Cycle.h('option', {value: 'bar'}, 'Bar'),
          Cycle.h('option', {value: 'baz'}, 'Baz')
        ]))
      };
      var renderer = createRenderer();
      renderer.inject(view);
      var selectEl = document.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
    });

    // BROKEN TEST
    // Our click simulation is not functioning under PhantomJS :(
    it.skip('should catch interaction events coming from a wrapped View', function (done) {
      var renderer = createRenderer();
      // Make a View reactively imitating another View
      var view = Cycle.createView(function () {
        return {
          vtree$: Rx.Observable.just(
            Cycle.h('h3.myelementclass', {onclick: 'asd$'}, 'Foobar')
          )
        };
      });
      var wrapperView = Cycle.createView(function (view) {
        return {
          vtree$: view.get('vtree$')
        };
      });
      renderer.inject(wrapperView);
      wrapperView.inject(view);
      // Make assertions
      var myElement = document.querySelector('.myelementclass');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      view.get('asd$').subscribe(function (ev) {
        assert.strictEqual(ev.screenX, 123);
        done();
      });
      assert.doesNotThrow(function () {
        click(myElement);
      })
    });
  });
});
