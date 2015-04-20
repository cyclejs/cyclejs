'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/cycle');
let Rendering = require('../../src/render');
let {Rx, h} = Cycle;

function createRenderTarget() {
  let element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return element;
}

describe('Custom Elements', function () {
  beforeEach(function () {
    Rendering.unregisterAllCustomElements();
    let testDivs = Array.prototype.slice.call(document.querySelectorAll('.cycletest'));
    testDivs.forEach(function (x) {
      if (x.remove) {
        x.remove();
      }
    });
  });

  describe('registerCustomElement', function () {
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
      let definitionFn = function () { return {}; };
      Cycle.registerCustomElement('myelement', definitionFn);
      assert.throws(function () {
        Cycle.registerCustomElement('myelement', definitionFn);
      }, /already registered/i);
    });

    it('should return nothing', function () {
      let result = Cycle.registerCustomElement('myelement', function () {
        return {};
      });
      assert.strictEqual(result, undefined);
    });
  });

  it('should recognize and create simple element that is registered', function () {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function (rootElem$) {
      // TODO these tests should not require shareReplay(1)! Remove and fix src/
      let vtree$ = Rx.Observable.just(h('h3.myelementclass')).shareReplay(1);
      rootElem$.inject(vtree$);
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [h('myelement', {key: 1})]));
    let rootElem$ = Cycle.render(vtree$, createRenderTarget());
    // Make assertions
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
    rootElem$.dispose();
  });

  it('should render inner state and properties independently', function (done) {
    // Make custom element with internal state, and properties as input
    Cycle.registerCustomElement('myelement', function (rootElem$, props) {
      let number$ = Rx.Observable.interval(10).take(9);
      let vtree$ = Rx.Observable
        .combineLatest(props.get('color$'), number$, function (color, number) {
          return h('h3.stateful-element',
            {style: {'color': color}},
            String(number)
          );
        });
      rootElem$.inject(vtree$);
    });
    // Use the custom element
    let color$ = Rx.Observable.just('#00FF00').delay(50).startWith('#FF0000');
    let vtree$ = color$.map(color =>
      h('div', [
        h('myelement', {key: 1, 'color': color})
      ])
    );
    let rootElem$ = Cycle.render(vtree$, createRenderTarget());
    // Make assertions
    setTimeout(function () {
      let myElement = document.querySelector('.stateful-element');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.strictEqual(myElement.textContent, '8');
      assert.strictEqual(myElement.style.color, 'rgb(0, 255, 0)');
      rootElem$.dispose();
      done();
    }, 500);
  });

  it('should recognize and create two unrelated elements', function () {
    // Make the first custom element
    Cycle.registerCustomElement('myelement1', function (rootElem$) {
      // TODO these tests should not require shareReplay(1)! Remove and fix src/
      rootElem$.inject(Rx.Observable.just(h('h1.myelement1class')).shareReplay(1));
    });
    // Make the second custom element
    Cycle.registerCustomElement('myelement2', function (rootElem$) {
      // TODO these tests should not require shareReplay(1)! Remove and fix src/
      rootElem$.inject(Rx.Observable.just(h('h2.myelement2class')).shareReplay(1));
    });
    // Use the custom elements
    let vtree$ = Rx.Observable.just(
      h('div', [
        h('myelement1'), h('myelement2')
      ])
    );
    let rootElem$ = Cycle.render(vtree$, createRenderTarget());
    // Make assertions
    let myElement1 = document.querySelector('.myelement1class');
    let myElement2 = document.querySelector('.myelement2class');
    assert.notStrictEqual(myElement1, null);
    assert.notStrictEqual(typeof myElement1, 'undefined');
    assert.strictEqual(myElement1.tagName, 'H1');
    assert.notStrictEqual(myElement2, null);
    assert.notStrictEqual(typeof myElement2, 'undefined');
    assert.strictEqual(myElement2.tagName, 'H2');
    rootElem$.dispose();
  });

  it('should recognize and create a nested custom elements', function () {
    // Make the inner custom element
    Cycle.registerCustomElement('inner', function (rootElem$) {
      // TODO these tests should not require shareReplay(1)! Remove and fix src/
      rootElem$.inject(Rx.Observable.just(h('h3.innerClass')).shareReplay(1));
    });
    // Make the outer custom element
    Cycle.registerCustomElement('outer', function (rootElem$) {
      // TODO these tests should not require shareReplay(1)! Remove and fix src/
      rootElem$.inject(Rx.Observable.just(
        h('div.outerClass', [
          h('inner', {key: 1})
        ])
      ).shareReplay(1));
    });
    // Use the custom elements
    let vtree$ = Rx.Observable.just(h('div', [h('outer', {key: 2})]));
    let rootElem$ = Cycle.render(vtree$, createRenderTarget());
    // Make assertions
    let innerElement = document.querySelector('.innerClass');
    assert.notStrictEqual(innerElement, null);
    assert.notStrictEqual(typeof innerElement, 'undefined');
    assert.strictEqual(innerElement.tagName, 'H3');
    rootElem$.dispose();
  });

  it('should catch interaction events coming from custom element', function (done) {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function (rootElem$) {
      // TODO these tests should not require shareReplay(1)! Remove and fix src/
      let vtree$ = Rx.Observable.just(h('h3.myelementclass', 'foobar')).shareReplay(1);
      rootElem$.inject(vtree$);
      return {
        myevent$: Rx.Observable.just(123).delay(300)
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('myelement.eventsource', {key: 1})
    ]));
    let rootElem$ = Cycle.createStream(function (vtree$) {
      return Cycle.render(vtree$, createRenderTarget());
    });
    rootElem$.interaction$.choose('.eventsource', 'myevent').subscribe(function (x) {
      assert.strictEqual(x.data, 123);
      rootElem$.dispose();
      done();
    });
    rootElem$.inject(vtree$);
    // Make assertions
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
  });

  it('should warn when custom element is used with no key', function () {
    let realConsole = console;
    let warnMessages = [];
    let noop = () => {};
    console = {
      log: noop,
      error: noop,
      warn: (msg) => warnMessages.push(msg)
    };
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function (rootElem$) {
      let vtree$ = Rx.Observable.just(h('h3.myelementclass'));
      rootElem$.inject(vtree$);
    });
    // Make VNode with a string as child
    let vtree$ = Rx.Observable.just(h('myelement'));
    let rootElem$ = Cycle.render(vtree$, createRenderTarget());
    console = realConsole;
    assert.strictEqual(warnMessages.length, 1);
    assert.strictEqual(warnMessages[0],
      'Missing `key` property for Cycle custom element MYELEMENT'
    );
    rootElem$.dispose();
  });

  it('should not fail when examining VirtualText on replaceCustomElements', function () {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function (rootElem$) {
      let vtree$ = Rx.Observable.just(h('h3.myelementclass')).shareReplay(1);
      rootElem$.inject(vtree$);
    });
    // Make VNode with a string as child
    let vtree$ = Rx.Observable.just(h('h1', 'This will be a VirtualText'));
    // Make assertions
    assert.doesNotThrow(function () {
      let rootElem$ = Cycle.render(vtree$, createRenderTarget());
      rootElem$.dispose();
    });
  });

  it('should not miss custom events from a list of custom elements #87', function (done) {
    // Make custom element
    Cycle.registerCustomElement('slider', function (rootElem$, props) {
      let id$ = Cycle.createStream(propsId$ => propsId$.shareReplay(1));
      let vtree$ = Cycle.createStream(id$ =>
        id$.map((id) => h('h3.internalslider', String(id))).shareReplay(1)
      );
      let remove$ = rootElem$.interaction$.choose('.internalslider', 'click')
        .map(() => true);
      rootElem$.inject(vtree$).inject(id$).inject(props.get('id$'));
      return {
        remove$: remove$.withLatestFrom(id$, (_, id) => id)
      };
    });

    // Make MVUI
    let items$ = Cycle.createStream(remove$ =>
      Rx.Observable
      .merge(
        Rx.Observable.just([{id: 23}]).delay(50),
        Rx.Observable.just([{id: 23}, {id: 45}]).delay(100)
      )
      .merge(remove$)
      .scan((items, x) => {
        if (typeof x === 'object') {
          return x;
        } else {
          return items.filter((item) => item.id !== x);
        }
      })
    );

    let vtree$ = items$
      .map((items) =>
        h('div.allSliders', items.map(item => h('slider.slider', {id: item.id})))
      ).shareReplay(1);

    let rootElem$ = Cycle.render(vtree$, createRenderTarget());

    let remove$ = rootElem$.interaction$.choose('.slider', 'remove')
      .map(event => event.data);

    items$.inject(remove$);

    // Simulate clicks
    setTimeout(() => document.querySelector('.internalslider').click(), 200);
    setTimeout(() => document.querySelector('.internalslider').click(), 300);

    // Make assertion
    setTimeout(() => {
      let sliders = document.querySelectorAll('.internalslider');
      assert.strictEqual(sliders.length, 0);
      rootElem$.dispose();
      done();
    }, 500);
  });

  it('should recognize nested vtree as properties.get(\'children$\')', function () {
    // Make simple custom element
    Cycle.registerCustomElement('simple-wrapper', function (rootElem$, properties) {
      let vtree$ = properties.get('children$').map(children =>
        h('div.wrapper', children)
      );
      rootElem$.inject(vtree$);
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('simple-wrapper', [
        h('h1', 'Hello'), h('h2', 'World')
      ])
    ]));
    let rootElem$ = Cycle.render(vtree$, createRenderTarget());
    // Make assertions
    let wrapper = document.querySelector('.wrapper');
    assert.notStrictEqual(wrapper, null);
    assert.notStrictEqual(typeof wrapper, 'undefined');
    assert.strictEqual(wrapper.tagName, 'DIV');
    rootElem$.dispose();
  });

  it('should throw error if children property is explicitly used', function (done) {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function (rootElem$) {
      let vtree$ = Rx.Observable.just(h('h3.myelementclass'));
      rootElem$.inject(vtree$);
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('myelement', {children: 123})
    ]));
    let rootElem$ = Cycle.createStream(function (vtree$) {
      return Cycle.render(vtree$, createRenderTarget());
    });
    rootElem$.subscribe(() => {}, function (err) {
      assert.strictEqual(err.message, 'Custom element should not have property ' +
        '`children`. This is reserved for children elements nested into this ' +
        'custom element.'
      );
      done();
    });
    rootElem$.inject(vtree$);
  });
});
