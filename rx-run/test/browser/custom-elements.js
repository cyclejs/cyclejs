'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/cycle');
let CustomElements = require('../../src/custom-elements');
let {Rx, h} = Cycle;

function createRenderTarget() {
  let element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return element;
}

describe('Custom Elements', function () {
  beforeEach(function () {
    CustomElements.unregisterAllCustomElements();
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
      assert.strictEqual(typeof result, 'undefined');
    });
  });

  it('should recognize and create simple element that is registered', function () {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [h('myelement', {key: 1})]));
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    // Make assertions
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
    domUI.dispose();
  });

  it('should render inner state and properties independently', function (done) {
    // Make custom element with internal state, and properties as input
    Cycle.registerCustomElement('myelement', function (interactions, props) {
      let number$ = Rx.Observable.interval(10).take(9);
      return {
        vtree$: Rx.Observable
          .combineLatest(props.get('color'), number$, function (color, number) {
            return h('h3.stateful-element',
              {style: {'color': color}},
              String(number)
            );
          })
      };
    });
    // Use the custom element
    function definitionFn() {
      return Rx.Observable.just('#00FF00').delay(50)
        .startWith('#FF0000')
        .map(color =>
          h('div', [
            h('myelement', {key: 1, 'color': color})
          ])
        );
    }
    let domUI = Cycle.applyToDOM(createRenderTarget(), definitionFn);
    // Make assertions
    setTimeout(function () {
      let myElement = document.querySelector('.stateful-element');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.strictEqual(myElement.textContent, '8');
      assert.strictEqual(myElement.style.color, 'rgb(0, 255, 0)');
      domUI.dispose();
      done();
    }, 500);
  });

  it('should recognize and create two unrelated elements', function () {
    // Make the first custom element
    Cycle.registerCustomElement('myelement1', function () {
      return {
        vtree$: Rx.Observable.just(h('h1.myelement1class'))
      };
    });
    // Make the second custom element
    Cycle.registerCustomElement('myelement2', function () {
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
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    // Make assertions
    let myElement1 = document.querySelector('.myelement1class');
    let myElement2 = document.querySelector('.myelement2class');
    assert.notStrictEqual(myElement1, null);
    assert.notStrictEqual(typeof myElement1, 'undefined');
    assert.strictEqual(myElement1.tagName, 'H1');
    assert.notStrictEqual(myElement2, null);
    assert.notStrictEqual(typeof myElement2, 'undefined');
    assert.strictEqual(myElement2.tagName, 'H2');
    domUI.dispose();
  });

  it('should recognize and create a nested custom elements', function () {
    // Make the inner custom element
    Cycle.registerCustomElement('inner', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.innerClass'))
      };
    });
    // Make the outer custom element
    Cycle.registerCustomElement('outer', function () {
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
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    // Make assertions
    let innerElement = document.querySelector('.innerClass');
    assert.notStrictEqual(innerElement, null);
    assert.notStrictEqual(typeof innerElement, 'undefined');
    assert.strictEqual(innerElement.tagName, 'H3');
    domUI.dispose();
  });

  it('should catch interaction events coming from custom element', function (done) {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass', 'foobar')),
        myevent$: Rx.Observable.just(123).delay(300)
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('myelement.eventsource', {key: 1})
    ]));
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    domUI.interactions.get('.eventsource', 'myevent').subscribe(x => {
      assert.strictEqual(x.data, 123);
      domUI.dispose();
      done();
    });
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
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    // Make VNode with a string as child
    let vtree$ = Rx.Observable.just(h('div', h('myelement')));
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    console = realConsole;
    assert.strictEqual(warnMessages.length, 1);
    assert.strictEqual(warnMessages[0],
      'Missing `key` property for Cycle custom element MYELEMENT'
    );
    domUI.dispose();
  });

  it('should not fail when examining VirtualText on replaceCustomElements', function () {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    // Make VNode with a string as child
    let vtree$ = Rx.Observable.just(h('h1', 'This will be a VirtualText'));
    // Make assertions
    assert.doesNotThrow(function () {
      let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
      domUI.dispose();
    });
  });

  it('should not miss custom events from a list of custom elements #87', function (done) {
    // Make custom element
    Cycle.registerCustomElement('slider', function (interactions, props) {
      let remove$ = interactions.get('.internalslider', 'click')
        .map(() => true);
      let id$ = props.get('id').shareReplay(1);
      let vtree$ = id$
        .map(id => h('h3.internalslider', String(id)));
      return {
        vtree$: vtree$,
        remove$: remove$.withLatestFrom(id$, (r, id) => id)
      };
    });

    function computer(interactions) {
      return Rx.Observable
        .merge(
          Rx.Observable.just([{id: 23}]).delay(50),
          Rx.Observable.just([{id: 23}, {id: 45}]).delay(100),
          interactions.get('.slider', 'remove').map(event => event.data)
        )
        .scan((items, x) => {
          if (typeof x === 'object') {
            return x;
          } else {
            return items.filter((item) => item.id !== x);
          }
        })
        .map(items =>
          h('div.allSliders', items.map(item => h('slider.slider', {id: item.id})))
        );
    }

    let domUI = Cycle.applyToDOM(createRenderTarget(), computer);

    // Simulate clicks
    setTimeout(() => document.querySelector('.internalslider').click(), 200);
    setTimeout(() => document.querySelector('.internalslider').click(), 300);

    // Make assertion
    setTimeout(() => {
      let sliders = document.querySelectorAll('.internalslider');
      assert.strictEqual(sliders.length, 0);
      domUI.dispose();
      done();
    }, 500);
  });

  it('should recognize nested vtree as properties.get(\'children\')', function () {
    // Make simple custom element
    Cycle.registerCustomElement('simple-wrapper', function (interactions, props) {
      return {
        vtree$: props.get('children').map(children => {
          return h('div.wrapper', children);
        })
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('simple-wrapper', [
        h('h1', 'Hello'), h('h2', 'World')
      ])
    ]));
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    // Make assertions
    let wrapper = document.querySelector('.wrapper');
    assert.notStrictEqual(wrapper, null);
    assert.notStrictEqual(typeof wrapper, 'undefined');
    assert.strictEqual(wrapper.tagName, 'DIV');
    domUI.dispose();
  });

  it('should throw error if children property is explicitly used', function (done) {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(h('div.toplevel', [
      h('myelement', {children: 123})
    ]));
    let observer = Rx.Observer.create(
      () => {},
      (err) => {
        assert.strictEqual(err.message, 'Custom element should not have property ' +
          '`children`. It is reserved for children elements nested into this ' +
          'custom element.'
        );
        // TODO: cannot dispose because applyToDOM has not yet completed.
        // domUI.dispose();
        done();
      }
    );
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$, {observer});
  });

  it('should recognize changes on a mutable collection given as props', function (done) {
    Cycle.registerCustomElement('x-element', function (interactions, props) {
      return {
        vtree$: props.get('list', () => false).map(list =>
          h('div', [
            h('ol', list.map(value => h('li.test-item', null, value)))
          ]))
      };
    });

    let counter = 0;
    function computer(interactions) {
      let clickMod$ = interactions.get('.button', 'click')
        .map(() => `item${++counter}`)
        .map(random => function mod(data) {
          data.push(random);
          return data;
        });
      return clickMod$
        .startWith([])
        .scan((data, modifier) => modifier(data))
        .map(data => h('.root', [
          h('button.button', 'add new item'),
          h('x-element', {key: 0, list: data})
        ]));
    }

    let domUI = Cycle.applyToDOM(createRenderTarget(), computer);

    setTimeout(() => document.querySelector('.button').click(), 100);
    setTimeout(() => document.querySelector('.button').click(), 200);
    setTimeout(() => {
      let items = document.querySelectorAll('li.test-item');
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].textContent, 'item1');
      assert.strictEqual(items[1].textContent, 'item2');
      domUI.dispose();
      done();
    }, 500);
  });

  it('should emit events even when dynamically evolving', function (done) {
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function () {
      // Here the vtree changes from <h3> to <button>, the myevent should
      // be emitted on <button> and not from the original <h3>.
      return {
        vtree$: Rx.Observable.merge(
          Rx.Observable.just(h('h3.myelementclass', 'foo')),
          Rx.Observable.just(h('button.myelementclass', 'bar')).delay(50)
        ),
        myevent$: Rx.Observable.just(123).delay(300)
      };
    });
    // Use the custom element
    let vtree$ = Rx.Observable.just(
      h('div.toplevel', [
        h('myelement.eventsource', {key: 1})
      ])
    );
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    domUI.interactions.get('.eventsource', 'myevent').subscribe(function (x) {
      assert.strictEqual(x.data, 123);
      domUI.dispose();
      done();
    });
    // Make assertions
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
  });

  it('should dispose vtree$ after destruction', function () {
    let log = [];
    let number$ = Rx.Observable.range(1, 2).controlled();
    let customElementSwitch$ = Rx.Observable.range(0, 2).controlled();
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: number$
          .do(i => log.push(i))
          .map(i => h('h3.myelementclass', String(i)))
      };
    });
    // Use the custom element
    let vtree$ = customElementSwitch$.map(theSwitch => {
      return theSwitch === 0
        ? h('div.toplevel', [h('myelement', {key: 1})])
        : h('div.toplevel', []);
    });
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    // Make assertions
    customElementSwitch$.request(1);
    number$.request(1);
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
    assert.strictEqual(log.length, 1);

    // Destroy the element
    customElementSwitch$.request(1);
    // Try to trigger onNext of myelement's vtree$
    number$.request(1);
    let destroyedElement = document.querySelector('.myelementclass');
    assert.strictEqual(destroyedElement, null);
    assert.notStrictEqual(log.length, 2);
    domUI.dispose();
  });

  it('should not emit events after destruction', function () {
    let log = [];
    let number$ = Rx.Observable.range(1, 3).controlled();
    let customElementSwitch$ = Rx.Observable.range(0, 2).controlled();
    // Make simple custom element
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass')),
        myevent$: number$.do(i => log.push(i))
      };
    });
    // Use the custom element
    let vtree$ = customElementSwitch$.map(theSwitch => {
      return theSwitch === 0
        ? h('div.toplevel', [h('myelement', {key: 1})])
        : h('div.toplevel', []);
    });
    let domUI = Cycle.applyToDOM(createRenderTarget(), () => vtree$);
    // Make assertions
    customElementSwitch$.request(1);
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');

    Rx.Observable.fromEvent(myElement, 'myevent')
      .take(3)
      .subscribe(function (ev){
        assert.notStrictEqual(ev.data, 3);
      });

    // Trigger the event
    number$.request(1);
    number$.request(1);

    // Destroy the element
    customElementSwitch$.request(1);
    let destroyedElement = document.querySelector('.myelementclass');
    assert.strictEqual(destroyedElement, null);

    // Trigger event after the element has been destroyed
    number$.request(1);
    assert.notStrictEqual(log.length, 3);

    domUI.dispose();
  });
});
