'use strict';
/* global describe, it */
var assert = require('assert');
var Cycle = require('../../src/cycle');
var Rx = Cycle.Rx;

describe('Custom Elements', function () {
  this.timeout(1000);

  beforeEach(function () {
    Cycle._customElements = null;
    var testDivs = Array.prototype.slice.call(document.querySelectorAll('.cycletest'));
    testDivs.forEach(function (x) { 
      if (x.remove) { x.remove(); }
    });
  });

  describe('Cycle.registerCustomElement', function () {
    it('should throw error if given no parameters', function () {
      assert.throws(function () {
        Cycle.registerCustomElement();
      }, /requires parameters/i);
    });

    it('should throw error if given only string (for tagName)', function () {
      assert.throws(function () {
        Cycle.registerCustomElement('myelement');
      }, /requires parameters/i);
    });

    it('should throw error if given only DataFlowNode', function () {
      var dfn = Cycle.createDataFlowNode(function () { return {}; });
      assert.throws(function () {
        Cycle.registerCustomElement(dfn);
      }, /requires parameters/i);
    });

    it('should not throw error if given correct and basic parameters', function () {
      var dfn = Cycle.createDataFlowNode(function () {
        return { vtree$: Cycle.h('div') };
      });
      assert.doesNotThrow(function () {
        Cycle.registerCustomElement('myelement', dfn);
      });
    });

    it('should throw error if given DataFlowNode does not export vtree$', function () {
      var dfn = Cycle.createDataFlowNode(function () { return {}; });
      assert.throws(function () {
        Cycle.registerCustomElement('myelement', dfn);
      }, /The dataFlowNode for a custom element must export `vtree\$`/i);
    });
  });

  it('should recognize and create simple element that is registered', function () {
    // Make simple custom element
    var dfn = Cycle.createDataFlowNode(function () {
      return { vtree$: Rx.Observable.just(Cycle.h('h3.myelementclass')) };
    });
    Cycle.registerCustomElement('myelement', dfn);
    // Use the custom element
    var viewContainerElem = document.createElement('div');
    viewContainerElem.className = 'cycletest';
    document.body.appendChild(viewContainerElem);
    var view = {
      vtree$: Rx.Observable.just(Cycle.h('myelement'))
    };
    Cycle.createRenderer(viewContainerElem).inject(view);
    // Make assertions
    var myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
  });

  it('should render inner state and attributes independently', function (done) {
    // Make custom element with internal state, and attributes as input
    var dfn = Cycle.createDataFlowNode(['color$'], function (attributes) {
      var number$ = Rx.Observable.interval(10).take(9);
      return {
        vtree$: Rx.Observable
          .combineLatest(attributes.color$, number$, function (color, number) {
            return Cycle.h('h3.stateful-element',
              {style: {'color': color}},
              String(number)
            );
          })
      };
    });
    Cycle.registerCustomElement('myelement', dfn);
    // Use the custom element
    var viewContainerElem = document.createElement('div');
    viewContainerElem.className = 'cycletest';
    document.body.appendChild(viewContainerElem);
    var color$ = Rx.Observable.just('#00FF00').delay(50).startWith('#FF0000');
    var view = {
      vtree$: color$.map(function (color) {
        return Cycle.h('myelement', {attributes: {'color': color}});
      })
    };
    Cycle.createRenderer(viewContainerElem).inject(view);
    // Make assertions
    setTimeout(function() {
      var myElement = document.querySelector('.stateful-element');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.strictEqual(myElement.textContent, '8')
      assert.strictEqual(myElement.style.color, 'rgb(0, 255, 0)');
      done();
    }, 150);
  });


  it('should recognize and create two unrelated elements', function () {
    // Make the first custom element
    var dfn1 = Cycle.createDataFlowNode(function () {
      return { vtree$: Rx.Observable.just(Cycle.h('h1.myelement1class')) };
    });
    Cycle.registerCustomElement('myelement1', dfn1);
    // Make the second custom element
    var dfn2 = Cycle.createDataFlowNode(function () {
      return { vtree$: Rx.Observable.just(Cycle.h('h2.myelement2class')) };
    });
    Cycle.registerCustomElement('myelement2', dfn2);
    // Use the custom elements
    var viewContainerElem = document.createElement('div');
    viewContainerElem.className = 'cycletest';
    document.body.appendChild(viewContainerElem);
    var view = {
      vtree$: Rx.Observable.just(Cycle.h('div', [
        Cycle.h('myelement1'), Cycle.h('myelement2')
      ]))
    };
    Cycle.createRenderer(viewContainerElem).inject(view);
    // Make assertions
    var myElement1 = document.querySelector('.myelement1class');
    var myElement2 = document.querySelector('.myelement2class');
    assert.notStrictEqual(myElement1, null);
    assert.notStrictEqual(typeof myElement1, 'undefined');
    assert.strictEqual(myElement1.tagName, 'H1');
    assert.notStrictEqual(myElement2, null);
    assert.notStrictEqual(typeof myElement2, 'undefined');
    assert.strictEqual(myElement2.tagName, 'H2');
  });

  it('should catch interaction events coming from a custom element', function (done) {
    // Make simple custom element
    var dfn = Cycle.createDataFlowNode(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h('h3.myelementclass')),
        myevent$: Rx.Observable.just(123).delay(100)
      };
    });
    Cycle.registerCustomElement('myelement', dfn);
    // Use the custom element
    var viewContainerElem = document.createElement('div');
    viewContainerElem.className = 'cycletest';
    document.body.appendChild(viewContainerElem);
    var view = Cycle.createView(function () {
      return {
        events: ['myelementEvents$'],
        vtree$: Rx.Observable.just(
          Cycle.h('myelement', {'ev-myevent': 'myelementEvents$'})
        )
      };
    });
    Cycle.createRenderer(viewContainerElem).inject(view);
    // Make assertions
    var myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
    view.myelementEvents$.subscribe(function (x) {
      assert.strictEqual(x, 123);
      done();
    });
  });
});
