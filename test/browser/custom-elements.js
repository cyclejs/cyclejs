'use strict';
/* global describe, it, beforeEach */
var assert = require('assert');
var Cycle = require('../../src/cycle');
var DOMUser = require('../../src/dom-user');
var Rx = Cycle.Rx;

function createDOMUser() {
  var element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return Cycle.createDOMUser(element);
}

describe('Custom Elements', function () {
  beforeEach(function () {
    DOMUser._customElements = null;
    var testDivs = Array.prototype.slice.call(document.querySelectorAll('.cycletest'));
    testDivs.forEach(function (x) {
      if (x.remove) { x.remove(); }
    });
  });

  describe('DOMUser.registerCustomElement', function () {
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

    it('should throw error if given only definitionFn', function () {
      assert.throws(function () {
        Cycle.registerCustomElement(function () { return {}; });
      }, /requires parameters/i);
    });

    it('should not throw error if given correct and basic parameters', function () {
      assert.doesNotThrow(function () {
        Cycle.registerCustomElement('myelement', function () {
          return {};
        });
      });
    });

    it('should not allow duplicate registered custom elements', function () {
      var definitionFn = function () { return {}; };
      Cycle.registerCustomElement('myelement', definitionFn);
      assert.throws(function () {
        Cycle.registerCustomElement('myelement', definitionFn);
      }, /already registered/i);
    });

    it('should return nothing', function () {
      var result = Cycle.registerCustomElement('myelement', function () {
        return {};
      });
      assert.strictEqual(result, undefined);
    });
  });

  it('should recognize and create simple element that is registered', function () {
    var user = createDOMUser();
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function (User) {
      var View = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('h3.myelementclass'))};
      });
      User.inject(View);
    });
    // Use the custom element
    var view = {
      vtree$: Rx.Observable.just(Cycle.h('myelement'))
    };
    user.inject(view);
    // Make assertions
    var myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
  });

  it('should render inner state and attributes independently', function (done) {
    var user = createDOMUser();
    // Make custom element with internal state, and properties as input
    Cycle.registerCustomElement('myelement', function (User, Properties) {
      var View = Cycle.createView(function (Properties) {
        var number$ = Rx.Observable.interval(10).take(9);
        return {
          vtree$: Rx.Observable
            .combineLatest(Properties.get('color$'), number$, function (color, number) {
              return Cycle.h('h3.stateful-element',
                {style: {'color': color}},
                String(number)
              );
            })
        };
      });
      User.inject(View).inject(Properties);
    });
    // Use the custom element
    var color$ = Rx.Observable.just('#00FF00').delay(50).startWith('#FF0000');
    var view = {
      vtree$: color$.map(function (color) {
        return Cycle.h('div', [
          Cycle.h('myelement', {key: 1, 'color': color})
        ]);
      })
    };
    user.inject(view);
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
    var user = createDOMUser();
    // Make the first custom element
    Cycle.registerCustomElement('myelement1', function (User) {
      var View = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('h1.myelement1class'))};
      });
      User.inject(View);
    });
    // Make the second custom element
    Cycle.registerCustomElement('myelement2', function (User) {
      var View = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('h2.myelement2class'))};
      });
      User.inject(View);
    });
    // Use the custom elements
    var view = {
      vtree$: Rx.Observable.just(Cycle.h('div', [
        Cycle.h('myelement1'), Cycle.h('myelement2')
      ]))
    };
    user.inject(view);
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

  it('should recognize and create a nested custom elements', function () {
    var user = createDOMUser();
    // Make the inner custom element
    Cycle.registerCustomElement('inner', function (User) {
      var View = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('h3.innerClass'))};
      });
      User.inject(View);
    });
    // Make the outer custom element
    Cycle.registerCustomElement('outer', function (User) {
      var View = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(
          Cycle.h('div.outerClass', [Cycle.h('inner')])
        )};
      });
      User.inject(View);
    });
    // Use the custom elements
    var view = {
      vtree$: Rx.Observable.just(Cycle.h('div', [Cycle.h('outer')]))
    };
    user.inject(view);
    // Make assertions
    var innerElement = document.querySelector('.innerClass');
    assert.notStrictEqual(innerElement, null);
    assert.notStrictEqual(typeof innerElement, 'undefined');
    assert.strictEqual(innerElement.tagName, 'H3');
  });

  // TODO make this pass
  it.skip('should catch interaction events coming from custom element', function (done) {
    var user = createDOMUser();
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function (user) {
      var View = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('h3.myelementclass'))};
      });
      user.inject(View);
      return {
        myevent$: Rx.Observable.just(123).delay(300)
      };
    });
    // Use the custom element
    var view = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h('myelement.eventsource'))
      };
    });
    user.event$('.eventsource', 'myevent').subscribe(function (x) {
      assert.strictEqual(x.data, 123);
      done();
    });
    user.inject(view);
    // Make assertions
    var myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
  });

  it('should not fail when examining VirtualText on replaceCustomElements', function () {
    var user = createDOMUser();
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function (User) {
      var View = Cycle.createView(function () {
        return {vtree$: Rx.Observable.just(Cycle.h('h3.myelementclass'))};
      });
      User.inject(View);
    });
    // Make VNode with a string as child
    var view = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just(
          Cycle.h('h1', 'This will be a VirtualText')
        )
      };
    });
    // Make assertions
    assert.doesNotThrow(function () {
      user.inject(view);
    });
  });
});
