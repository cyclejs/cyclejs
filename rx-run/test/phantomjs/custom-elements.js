'use strict';
/* global describe, it, beforeEach */
var assert = require('assert');
var Cycle = require('../../src/cycle');
var Renderer = require('../../src/renderer');
var Rx = Cycle.Rx;

function createRenderer() {
  var element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return Cycle.createRenderer(element);
}

describe('Custom Elements', function () {
  this.timeout(1000);

  beforeEach(function () {
    Renderer._customElements = null;
    var testDivs = Array.prototype.slice.call(document.querySelectorAll('.cycletest'));
    testDivs.forEach(function (x) {
      if (x.remove) { x.remove(); }
    });
  });

  describe('Renderer.registerCustomElement', function () {
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

    it('should throw error if given only View input', function () {
      var view = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(1)};
      });
      assert.throws(function () {
        Cycle.registerCustomElement(view);
      }, /requires parameters/i);
    });

    it('should not throw error if given correct and basic parameters', function () {
      var view = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('div'))};
      });
      assert.doesNotThrow(function () {
        Cycle.registerCustomElement('myelement', view);
      });
    });

    it('should not allow duplicate registered custom elements', function () {
      var view1 = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('div'))};
      });
      var view2 = view1.clone();
      Cycle.registerCustomElement('myelement', view1);
      assert.throws(function () {
        Cycle.registerCustomElement('myelement', view2);
      }, /already registered/i);
    });

    it('should throw error if given DataFlowNode does not export vtree$', function () {
      var dfn = Cycle.createDataFlowNode(function () { return {}; });
      assert.throws(function () {
        Cycle.registerCustomElement('myelement', dfn);
      }, /The dataFlowNode for a custom element must export `vtree\$`/i);
    });

    it('should return nothing', function () {
      var view = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('div'))};
      });
      var result = Cycle.registerCustomElement('myelement', view);
      assert.strictEqual(result, undefined);
    });
  });

  it('should recognize and create simple element that is registered', function () {
    var renderer = createRenderer();
    // Make simple custom element
    var component = Cycle.createView(function () {
      return {vtree$: Rx.Observable.just(Cycle.h('h3.myelementclass'))};
    });
    Cycle.registerCustomElement('myelement', component);
    // Use the custom element
    var view = {
      vtree$: Rx.Observable.just(Cycle.h('myelement'))
    };
    renderer.inject(view);
    // Make assertions
    var myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
  });

  it('should render inner state and attributes independently', function (done) {
    var renderer = createRenderer();
    // Make custom element with internal state, and attributes as input
    var component = Cycle.createView(function (attributes) {
      var number$ = Rx.Observable.interval(10).take(9);
      return {
        vtree$: Rx.Observable
          .combineLatest(attributes.get('color$'), number$, function (color, number) {
            return Cycle.h('h3.stateful-element',
              {style: {'color': color}},
              String(number)
            );
          })
      };
    });
    Cycle.registerCustomElement('myelement', component);
    // Use the custom element
    var color$ = Rx.Observable.just('#00FF00').delay(50).startWith('#FF0000');
    var view = {
      vtree$: color$.map(function (color) {
        return Cycle.h('myelement', {attributes: {'color': color}});
      })
    };
    renderer.inject(view);
    // Make assertions
    setTimeout(function () {
      var myElement = document.querySelector('.stateful-element');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.strictEqual(myElement.textContent, '8');
      assert.strictEqual(myElement.style.color, 'rgb(0, 255, 0)');
      done();
    }, 500);
  });

  it('should recognize and create two unrelated elements', function () {
    var renderer = createRenderer();
    // Make the first custom element
    var component1 = Cycle.createView(function () {
      return {vtree$: Rx.Observable.just(Cycle.h('h1.myelement1class'))};
    });
    Cycle.registerCustomElement('myelement1', component1);
    // Make the second custom element
    var component2 = Cycle.createView(function () {
      return {vtree$: Rx.Observable.just(Cycle.h('h2.myelement2class'))};
    });
    Cycle.registerCustomElement('myelement2', component2);
    // Use the custom elements
    var view = {
      vtree$: Rx.Observable.just(Cycle.h('div', [
        Cycle.h('myelement1'), Cycle.h('myelement2')
      ]))
    };
    renderer.inject(view);
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

  it('should recognize and create a custom element inside another', function () {
    var renderer = createRenderer();
    // Make the inner custom element
    var component1 = Cycle.createView(function () {
      return {vtree$: Rx.Observable.just(Cycle.h('h3.innerClass'))};
    });
    Cycle.registerCustomElement('inner', component1);
    // Make the outer custom element
    var component2 = Cycle.createView(function () {
      return {vtree$: Rx.Observable.just(Cycle.h('div.outerClass', [Cycle.h('inner')]))};
    });
    Cycle.registerCustomElement('outer', component2);
    // Use the custom elements
    var view = {
      vtree$: Rx.Observable.just(Cycle.h('div', [Cycle.h('outer')]))
    };
    renderer.inject(view);
    // Make assertions
    var innerElement = document.querySelector('.innerClass');
    assert.notStrictEqual(innerElement, null);
    assert.notStrictEqual(typeof innerElement, 'undefined');
    assert.strictEqual(innerElement.tagName, 'H3');
  });

  it('should catch interaction events coming from a custom element', function (done) {
    var renderer = createRenderer();
    // Make simple custom element
    var component = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h('h3.myelementclass')),
        myevent$: Rx.Observable.just(123).delay(100)
      };
    });
    Cycle.registerCustomElement('myelement', component);
    // Use the custom element
    var view = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just(
          Cycle.h('myelement', {onmyevent: 'myelementEvents$'})
        )
      };
    });
    renderer.inject(view);
    // Make assertions
    var myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
    view.get('myelementEvents$').subscribe(function (x) {
      assert.strictEqual(x, 123);
      done();
    });
  });

  it('should not fail when examining VirtualText on replaceCustomElements', function () {
    var renderer = createRenderer();
    // Make simple custom element
    var component = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h('h3.myelementclass'))
      };
    });
    Cycle.registerCustomElement('myelement', component);
    // Use the custom element
    var view = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just(
          Cycle.h('h1', 'This will be a VirtualText')
        )
      };
    });
    // Make assertions
    assert.doesNotThrow(function () {
      renderer.inject(view);
    });
  });
});
