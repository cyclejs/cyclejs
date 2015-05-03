'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/cycle');
let {Rx, h} = Cycle;

function createRenderTarget() {
  let element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return element;
}

describe('Custom Elements', function () {
  beforeEach(function () {
    let testDivs = Array.prototype.slice.call(document.querySelectorAll('.cycletest'));
    testDivs.forEach(function (x) {
      if (x.remove) {
        x.remove();
      }
    });
  });

  describe('registerCustomElement', function () {
    it('should throw error if given no parameters', function () {
      let customElements = new Cycle.CustomElementsRegistry();
      assert.throws(function () {
        customElements.registerCustomElement();
      }, /requires parameters/i);
    });

    it('should throw error if given only string (for tagName)', function () {
      let customElements = new Cycle.CustomElementsRegistry();
      assert.throws(function () {
        customElements.registerCustomElement('myelement');
      }, /requires parameters/i);
    });

    it('should throw error if given only definitionFn', function () {
      let customElements = new Cycle.CustomElementsRegistry();
      assert.throws(function () {
        customElements.registerCustomElement(function () {});
      }, /requires parameters/i);
    });

    it('should not throw error if given correct and basic parameters', function () {
      let customElements = new Cycle.CustomElementsRegistry();
      assert.doesNotThrow(function () {
        customElements.registerCustomElement('myelment', function () {});
      });
    });

    it('should not allow duplicate registered custom elements', function () {
      let customElements = new Cycle.CustomElementsRegistry();
      let definitionFn = function () {};
      customElements.registerCustomElement('myelement', definitionFn);
      assert.throws(function () {
        customElements.registerCustomElement('myelement', definitionFn);
      }, /already registered/i);
    });

    it('should return nothing', function () {
      let customElements = new Cycle.CustomElementsRegistry();
      let result = customElements.registerCustomElement('myelement', function () {});
      assert.strictEqual(result, undefined);
    });
  });

  it('should recognize and create simple element that is registered', function () {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make simple custom element
    customElements.registerCustomElement('myelement', function () {
      let vtree$ = Rx.Observable.just(h('h3.myelementclass'));
      return {
        vtree$
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [h('myelement', {key: 1})]));
    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);

    reactiveNode.connect();

    // Make assertions
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
  });

  it('should render inner state and properties independently', function (done) {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make custom element with internal state, and properties as input
    customElements.registerCustomElement('myelement', function (props$) {
      let number$ = Rx.Observable.interval(10).take(9);
      let vtree$ = Rx.Observable
        .combineLatest(props$.map(m => m.color), number$, function (color, number) {
          return h('h3.stateful-element',
            {style: {'color': color}},
            String(number)
          );
        });
      return {
        vtree$
      };
    });
    // Use the custom element
    let color$ = Rx.Observable.just('#00FF00').delay(50).startWith('#FF0000');
    let vtree$ = color$.map(color =>
      h('div', [
        h('myelement', {key: 1, 'color': color})
      ])
    );
    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);
    reactiveNode.connect();
    // Make assertions
    setTimeout(function () {
      let myElement = document.querySelector('.stateful-element');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.strictEqual(myElement.textContent, '8');
      assert.strictEqual(myElement.style.color, 'rgb(0, 255, 0)');
      done();
    }, 500);
  });

  it('should recognize and create two unrelated elements', function () {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make the first custom element
    customElements.registerCustomElement('myelement1', function () {
      return {
        vtree$: Rx.Observable.just(h('h1.myelement1class'))
      };
    });
    // Make the second custom element
    customElements.registerCustomElement('myelement2', function () {
      return {
        vtree$: Rx.Observable.just(h('h2.myelement2class'))
      };
    });
    // Use the custom elements
    let vtree$ = Rx.Observable.just(
      h('div', [
        h('myelement1'), h('myelement2')
      ])
    );
    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);
    reactiveNode.connect();
    // Make assertions
    let myElement1 = document.querySelector('.myelement1class');
    let myElement2 = document.querySelector('.myelement2class');
    assert.notStrictEqual(myElement1, null);
    assert.notStrictEqual(typeof myElement1, 'undefined');
    assert.strictEqual(myElement1.tagName, 'H1');
    assert.notStrictEqual(myElement2, null);
    assert.notStrictEqual(typeof myElement2, 'undefined');
    assert.strictEqual(myElement2.tagName, 'H2');
  });

  it('should recognize and create a nested custom elements', function () {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make the inner custom element
    customElements.registerCustomElement('inner', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.innerClass'))
      };
    });
    // Make the outer custom element
    customElements.registerCustomElement('outer', function () {
      return {
        vtree$: Rx.Observable.just(
          h('div.outerClass', [
            h('inner', {key: 1})
          ])
        )
      };
    });
    // Use the custom elements
    let vtree$ = Rx.Observable.just(h('div', [h('outer', {key: 2})]));
    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);
    reactiveNode.connect();
    // Make assertions
    let innerElement = document.querySelector('.innerClass');
    assert.notStrictEqual(innerElement, null);
    assert.notStrictEqual(typeof innerElement, 'undefined');
    assert.strictEqual(innerElement.tagName, 'H3');
  });

  it('should catch interaction events coming from custom element', function (done) {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make simple custom element
    customElements.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass', 'foobar')),
        events: {
          myevent$: Rx.Observable.just(123).delay(300)
        }
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('myelement.eventsource', {key: 1})
    ]));
    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);

    // Assert events
    reactiveNode.interactions
      .choose('.eventsource', 'myevent')
      .take(1)
      .subscribe(function (x) {
        assert.strictEqual(x.data, 123);
      }, null, done);
    reactiveNode.connect();
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
    let customElements = new Cycle.CustomElementsRegistry();
    // Make simple custom element
    customElements.registerCustomElement('myelement', function (rootElem$) {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    // Make VNode with a string as child
    let vtree$ = Rx.Observable.just(h('div', [h('myelement')]));
    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);
    reactiveNode.connect();
    console = realConsole;
    assert.strictEqual(warnMessages.length, 1);
    assert.strictEqual(warnMessages[0],
      'Missing `key` property for Cycle custom element MYELEMENT'
    );
  });

  it('should not fail when examining VirtualText on replaceCustomElements', function () {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make simple custom element
    customElements.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    // Make VNode with a string as child
    let vtree$ = Rx.Observable.just(h('h1', 'This will be a VirtualText'));
    // Make assertions
    assert.doesNotThrow(function () {
      let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);
      reactiveNode.connect();
    });
  });

  it('should not miss custom events from a list of custom elements #87', function (done) {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make custom element
    customElements.registerCustomElement('slider', function (props$, interactions) {
      let id$ = props$.map(p => p.id);
      let vtree$ = id$.map(id => h('h3.internalslider', String(id)));
      let remove$ = interactions.choose('.internalslider', 'click')
        .map(() => true);
      return {
        vtree$,
        events: {
          remove$: remove$.withLatestFrom(id$, (_, id) => id)
        }
      };
    });

    // Make MVUI
    let itemsSubject$ = new Rx.Subject();
    let items$ = Rx.Observable.merge(
      Rx.Observable.just([{id: 23}]).delay(50),
      Rx.Observable.just([{id: 23}, {id: 45}]).delay(100)
    ).merge(itemsSubject$)
    .scan((items, x) => {
      if (Array.isArray(x)) {
        return x;
      } else {
        return items.filter((item) => item.id !== x);
      }
    });

    let vtree$ = items$
      .map((items) =>
        h('div.allSliders', items.map(item => h('slider.slider', {id: item.id})))
      );

    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);
    let remove$ = reactiveNode.interactions.choose('.slider', 'remove')
      .map(event => event.data)
      .multicast(itemsSubject$);
    remove$.subscribe();
    remove$.connect();
    reactiveNode.connect();


    // Simulate clicks
    setTimeout(() => document.querySelector('.internalslider').click(), 200);
    setTimeout(() => document.querySelector('.internalslider').click(), 300);

    // Make assertion
    setTimeout(() => {
      let sliders = document.querySelectorAll('.internalslider');
      assert.strictEqual(sliders.length, 0);
      done();
    }, 500);
  });

  it('should recognize nested vtree as props.map(p => p.children)', function () {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make simple custom element
    customElements.registerCustomElement('simple-wrapper', function (props$) {
      let vtree$ = props$.map(p => p.children).map(children =>
        h('div.wrapper', children)
      );
      return {
        vtree$
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('simple-wrapper', [
        h('h1', 'Hello'), h('h2', 'World')
      ])
    ]));
    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);
    reactiveNode.connect();
    // Make assertions
    let wrapper = document.querySelector('.wrapper');
    assert.notStrictEqual(wrapper, null);
    assert.notStrictEqual(typeof wrapper, 'undefined');
    assert.strictEqual(wrapper.tagName, 'DIV');
  });

  it('should throw error if children property is explicitly used', function () {
    let customElements = new Cycle.CustomElementsRegistry();
    // Make simple custom element
    customElements.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('myelement', {children: 123})
    ]));
    let reactiveNode = Cycle.render(vtree$, createRenderTarget(), customElements);
    assert.throws(() => {
      reactiveNode.connect();
    }, (err) => {
      return err.message == ('Custom element should not have property ' +
        '`children`. This is reserved for children elements nested into this ' +
        'custom element.');
    });
  });

  // no longer need this because breaking the change of props$
  it.skip('should recognize changes on a mutable collection given as props');
});
