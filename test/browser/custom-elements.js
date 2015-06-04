'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/core/cycle');
let CustomElements = require('../../src/web/custom-elements');
let {Rx, h} = Cycle;

function createRenderTarget() {
  let element = document.createElement('div');
  element.className = 'cycletest';
  document.body.appendChild(element);
  return element;
}

describe('Custom Elements', function () {
  beforeEach(function () {
    Array.prototype.slice.call(document.querySelectorAll('.cycletest'))
      .forEach(function (x) {
        if (x.remove) {
          x.remove();
        }
      });
  });

  describe('Registry on makeDOMAdapter', function () {
    it('should throw error if definitionFn is not a function', function () {
      let element = createRenderTarget();
      assert.throws(function () {
        Cycle.makeDOMAdapter(element, {'my-elem': 123});
      }, /definition given to the DOM adapter should be a function/i);
    });

    it('should not throw error if given correct parameters', function () {
      let element = createRenderTarget();
      assert.doesNotThrow(function () {
        Cycle.makeDOMAdapter(element, {'my-elem': function myElem() {}});
      });
    });
  });

  it('should recognize and create simple element that is registered', function () {
    // Make simple custom element
    function myElementDef() {
      return {
        dom: Rx.Observable.just(h('h3.myelementclass'))
      };
    }
    // Use the custom element
    function app() {
      return {
        dom: Rx.Observable.just(h('div.toplevel', [h('my-element', {key: 1})]))
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    // Make assertions
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');
    adaptersOutput.dispose();
  });

  it('should render inner state and properties independently', function (done) {
    // Make custom element with internal state, and properties as input
    function myElementDef(ext) {
      let number$ = Rx.Observable.interval(10).take(9);
      return {
        dom: Rx.Observable.combineLatest(ext.get('props', 'color'), number$,
          function (color, number) {
            return h('h3.stateful-element', {style: {color}}, String(number));
          }
        )
      };
    }
    // Use the custom element
    function app() {
      return {
        dom: Rx.Observable.just('#00FF00').delay(50)
          .startWith('#FF0000')
          .map(color =>
            h('div', [
              h('my-element', {key: 1, 'color': color})
            ])
        )
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    // Make assertions
    setTimeout(function () {
      let myElement = document.querySelector('.stateful-element');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.strictEqual(myElement.textContent, '8');
      assert.strictEqual(myElement.style.color, 'rgb(0, 255, 0)');
      adaptersOutput.dispose();
      done();
    }, 500);
  });

  it('should have Observable properties object as get(\'props\', \'*\')', function (done) {
    // Make custom element
    function myElementDef(ext) {
      return {
        dom: ext.get('props', '*').map(propsObj => {
          assert.strictEqual(typeof propsObj, 'object');
          assert.notStrictEqual(propsObj, null);
          assert.strictEqual(propsObj.color, '#FF0000');
          assert.strictEqual(propsObj.content, 'Hello world');
          return h('h3.inner-element',
            {style: {color: propsObj.color}},
            String(propsObj.content)
          );
        })
      };
    }
    function app() {
      return {
        dom: Rx.Observable.just(
          h('div', [
            h('my-element', {color: '#FF0000', content: 'Hello world'})
          ])
        )
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    // Make assertions
    setTimeout(function () {
      let myElement = document.querySelector('.inner-element');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.strictEqual(myElement.textContent, 'Hello world');
      assert.strictEqual(myElement.style.color, 'rgb(255, 0, 0)');
      adaptersOutput.dispose();
      done();
    }, 30);
  });

  it('should have Observable properties object as get(\'props\')', function (done) {
    // Make custom element
    function myElementDef(ext) {
      return {
        dom: ext.get('props').map(propsObj => {
          assert.strictEqual(typeof propsObj, 'object');
          assert.notStrictEqual(propsObj, null);
          assert.strictEqual(propsObj.color, '#FF0000');
          assert.strictEqual(propsObj.content, 'Hello world');
          return h('h3.inner-element',
            {style: {color: propsObj.color}},
            String(propsObj.content)
          );
        })
      };
    }
    function app() {
      return {
        dom: Rx.Observable.just(
          h('div', [
            h('my-element', {color: '#FF0000', content: 'Hello world'})
          ])
        )
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    // Make assertions
    setTimeout(function () {
      let myElement = document.querySelector('.inner-element');
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.strictEqual(myElement.textContent, 'Hello world');
      assert.strictEqual(myElement.style.color, 'rgb(255, 0, 0)');
      adaptersOutput.dispose();
      done();
    }, 30);
  });

  it('should recognize and create two unrelated elements', function () {
    // Make the first custom element
    function myElementDef1() {
      return {
        dom: Rx.Observable.just(h('h1.myelement1class'))
      };
    }
    // Make the second custom element
    function myElementDef2() {
      return {
        dom: Rx.Observable.just(h('h2.myelement2class'))
      };
    }
    // Use the custom elements
    function app() {
      return {
        dom: Rx.Observable.just(
          h('div', [
            h('my-element1'), h('my-element2')
          ])
        )
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element1': myElementDef1,
        'my-element2': myElementDef2
      })
    });
    // Make assertions
    let myElement1 = document.querySelector('.myelement1class');
    let myElement2 = document.querySelector('.myelement2class');
    assert.notStrictEqual(myElement1, null);
    assert.notStrictEqual(typeof myElement1, 'undefined');
    assert.strictEqual(myElement1.tagName, 'H1');
    assert.notStrictEqual(myElement2, null);
    assert.notStrictEqual(typeof myElement2, 'undefined');
    assert.strictEqual(myElement2.tagName, 'H2');
    adaptersOutput.dispose();
  });

  it('should recognize and create a nested custom elements', function () {
    // Make the inner custom element
    function innerElementDef() {
      return {
        dom: Rx.Observable.just(h('h3.innerClass'))
      };
    }
    // Make the outer custom element
    function outerElementDef() {
      return {
        dom: Rx.Observable.just(
          h('div.outerClass', [
            h('inner-element', {key: 1})
          ])
        )
      };
    }
    // Use the custom elements
    function app() {
      return {
        dom: Rx.Observable.just(h('div', [h('outer-element', {key: 2})]))
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'inner-element': innerElementDef,
        'outer-element': outerElementDef
      })
    });
    // Make assertions
    let innerElement = document.querySelector('.innerClass');
    assert.notStrictEqual(innerElement, null);
    assert.notStrictEqual(typeof innerElement, 'undefined');
    assert.strictEqual(innerElement.tagName, 'H3');
    adaptersOutput.dispose();
  });

  it('should catch interaction events coming from custom element', function (done) {
    // Make simple custom element
    function myElementDef() {
      return {
        dom: Rx.Observable.just(h('h3.myelementclass', 'foobar')),
        events: {
          myevent: Rx.Observable.just(123).delay(300)
        }
      };
    }
    // Use the custom element
    function app() {
      return {
        dom: Rx.Observable.just(h('div.toplevel', [
          h('my-element.eventsource', {key: 1})
        ]))
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    adaptersOutput.get('dom', '.eventsource', 'myevent').subscribe(ev => {
      assert.strictEqual(ev.detail, 123);
      adaptersOutput.dispose();
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
    function myElementDef() {
      return {
        dom: Rx.Observable.just(h('h3.myelementclass'))
      };
    }
    // Make VNode with a string as child
    function app() {
      return {
        dom: Rx.Observable.just(h('div', h('my-element')))
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    console = realConsole;
    assert.strictEqual(warnMessages.length, 1);
    assert.strictEqual(warnMessages[0],
      'Missing `key` property for Cycle custom element MY-ELEMENT'
    );
    adaptersOutput.dispose();
  });

  it('should not fail when examining VirtualText on replaceCustomElements', function () {
    // Make simple custom element
    function myElementDef() {
      return {
        dom: Rx.Observable.just(h('h3.myelementclass'))
      };
    }
    // Make VNode with a string as child
    function app() {
      return {
        dom: Rx.Observable.just(h('h1', 'This will be a VirtualText'))
      };
    }
    // Make assertions
    assert.doesNotThrow(function () {
      let [appOutput, adaptersOutput] = Cycle.run(app, {
        dom: Cycle.makeDOMAdapter(createRenderTarget(), {
          'my-element': myElementDef
        })
      });
      adaptersOutput.dispose();
    });
  });

  it('should not miss custom events from a list of custom elements #87', function (done) {
    // Make custom element
    function sliderDef(ext) {
      let remove$ = ext.get('dom', '.internalslider', 'click').map(() => true);
      let id$ = ext.get('props', 'id').shareReplay(1);
      let vtree$ = id$.map(id => h('h3.internalslider', String(id)));
      return {
        dom: vtree$,
        events: {
          remove: remove$.withLatestFrom(id$, (r, id) => id)
        }
      };
    }

    function app(ext) {
      return {
        dom: Rx.Observable
          .merge(
            Rx.Observable.just([{id: 23}]).delay(50),
            Rx.Observable.just([{id: 23}, {id: 45}]).delay(100),
            ext.get('dom', '.slider', 'remove').map(event => event.detail)
          )
          .scan((items, x) => {
            if (typeof x === 'object') {
              return x;
            } else {
              return items.filter((item) => item.id !== x);
            }
          })
          .map(items =>
            h('div.allSliders', items.map(item => h('slider-elem.slider', {id: item.id})))
          )
      };
    }

    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'slider-elem': sliderDef
      })
    });

    // Simulate clicks
    setTimeout(() => document.querySelector('.internalslider').click(), 200);
    setTimeout(() => document.querySelector('.internalslider').click(), 300);

    // Make assertion
    setTimeout(() => {
      let sliders = document.querySelectorAll('.internalslider');
      assert.strictEqual(sliders.length, 0);
      adaptersOutput.dispose();
      done();
    }, 500);
  });

  it('should recognize nested vtree as properties.get(\'children\')', function () {
    // Make simple custom element
    function simpleWrapperDef(ext) {
      return {
        dom: ext.get('props', 'children').map(children => {
          return h('div.wrapper', children);
        })
      };
    }
    // Use the custom element
    function app() {
      return {
        dom: Rx.Observable.just(h('div.toplevel', [
          h('simple-wrapper', [
            h('h1', 'Hello'), h('h2', 'World')
          ])
        ]))
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'simple-wrapper': simpleWrapperDef
      })
    });
    // Make assertions
    let wrapper = document.querySelector('.wrapper');
    assert.notStrictEqual(wrapper, null);
    assert.notStrictEqual(typeof wrapper, 'undefined');
    assert.strictEqual(wrapper.tagName, 'DIV');
    adaptersOutput.dispose();
  });

  it('should throw error if children property is explicitly used', function (done) {
    // Make simple custom element
    function myElementDef() {
      return {
        dom: Rx.Observable.just(h('h3.myelementclass'))
      };
    }
    // Use the custom element
    function app() {
      return {
        dom: Rx.Observable.just(h('div.toplevel', [
          h('my-element', {children: 123})
        ]))
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    adaptersOutput.get('dom', ':root').subscribeOnError((err) => {
      assert.strictEqual(err.message, 'Custom element should not have property ' +
        '`children`. It is reserved for children elements nested into this ' +
        'custom element.'
      );
      adaptersOutput.dispose();
      done();
    });
  });

  it('should recognize changes on a mutable collection given as props', function (done) {
    function xElementDef(ext) {
      return {
        dom: ext.get('props', 'list', () => false).map(list =>
          h('div', [
            h('ol', list.map(value => h('li.test-item', null, value)))
          ]))
      };
    }

    let counter = 0;
    function app(ext) {
      let clickMod$ = ext.get('dom', '.button', 'click')
        .map(() => `item${++counter}`)
        .map(random => function mod(data) {
          data.push(random);
          return data;
        });
      return {
        dom: clickMod$
          .startWith([])
          .scan((data, modifier) => modifier(data))
          .map(data => h('.root', [
            h('button.button', 'add new item'),
            h('x-element', {key: 0, list: data})
          ]))
      };
    }

    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'x-element': xElementDef
      })
    });

    setTimeout(() => document.querySelector('.button').click(), 100);
    setTimeout(() => document.querySelector('.button').click(), 200);
    setTimeout(() => {
      let items = document.querySelectorAll('li.test-item');
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].textContent, 'item1');
      assert.strictEqual(items[1].textContent, 'item2');
      adaptersOutput.dispose();
      done();
    }, 500);
  });

  it('should emit events even when dynamically evolving', function (done) {
    // Make simple custom element
    function myElementDef() {
      // Here the vtree changes from <h3> to <button>, the myevent should
      // be emitted on <button> and not from the original <h3>.
      return {
        dom: Rx.Observable.merge(
          Rx.Observable.just(h('h3.myelementclass', 'foo')),
          Rx.Observable.just(h('button.myelementclass', 'bar')).delay(50)
        ),
        events: {
          myevent: Rx.Observable.just(123).delay(300)
        }
      };
    }
    // Use the custom element
    function app() {
      return {
        dom: Rx.Observable.just(
          h('div.toplevel', [
            h('my-element.eventsource', {key: 1})
          ])
        )
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    adaptersOutput.get('dom', '.eventsource', 'myevent').subscribe(ev => {
      assert.strictEqual(ev.detail, 123);
      adaptersOutput.dispose();
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
    function myElementDef() {
      return {
        dom: number$
          .do(i => log.push(i))
          .map(i => h('h3.myelementclass', String(i)))
      };
    }
    // Use the custom element
    function app() {
      return {
        dom: customElementSwitch$.map(theSwitch => {
          return theSwitch === 0
            ? h('div.toplevel', [h('my-element', {key: 1})])
            : h('div.toplevel', []);
        })
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
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
    let destroyedElement = document.querySelector('.myelementclass');
    assert.strictEqual(destroyedElement, null);
    assert.notStrictEqual(log.length, 2);
    adaptersOutput.dispose();
  });

  it('should not emit events after destruction', function () {
    let log = [];
    let number$ = Rx.Observable.range(1, 3).controlled();
    let customElementSwitch$ = Rx.Observable.range(0, 2).controlled();
    // Make simple custom element
    function myElementDef() {
      return {
        dom: Rx.Observable.just(h('h3.myelementclass')),
        events: {
          myevent: number$.do(i => log.push(i))
        }
      };
    }
    // Use the custom element
    function app() {
      return {
        dom: customElementSwitch$.map(theSwitch => {
          return theSwitch === 0
            ? h('div.toplevel', [h('my-element', {key: 1})])
            : h('div.toplevel', []);
        })
      };
    }
    let [appOutput, adaptersOutput] = Cycle.run(app, {
      dom: Cycle.makeDOMAdapter(createRenderTarget(), {
        'my-element': myElementDef
      })
    });
    // Make assertions
    customElementSwitch$.request(1);
    let myElement = document.querySelector('.myelementclass');
    assert.notStrictEqual(myElement, null);
    assert.notStrictEqual(typeof myElement, 'undefined');
    assert.strictEqual(myElement.tagName, 'H3');

    Rx.Observable.fromEvent(myElement, 'myevent')
      .take(3)
      .subscribe(function (ev) {
        assert.notStrictEqual(ev.detail, 3);
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

    adaptersOutput.dispose();
  });
});
