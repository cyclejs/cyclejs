/** @jsx hJSX */
'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/core');
let CycleDOM = require('../../src/cycle-dom');
let Fixture89 = require('./fixtures/issue-89');
let {Rx} = Cycle;
let {h, hJSX, makeDOMDriver} = CycleDOM;

function createRenderTarget(id = null) {
  let element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

describe('Rendering', function () {
  describe('makeDOMDriver', function () {
    it('should accept a DOM element as input', function () {
      let element = createRenderTarget();
      assert.doesNotThrow(function () {
        makeDOMDriver(element);
      });
    });

    it('should accept a DocumentFragment as input', function () {
      let element = document.createDocumentFragment();
      assert.doesNotThrow(function () {
        makeDOMDriver(element);
      });
    });

    it('should accept a string selector to an existing element as input', function () {
      let id = 'testShouldAcceptSelectorToExisting';
      let element = createRenderTarget();
      element.id = id;
      assert.doesNotThrow(function () {
        makeDOMDriver('#' + id);
      });
    });

    it('should not accept a selector to an unknown element as input', function () {
      assert.throws(function () {
        makeDOMDriver('#nonsenseIdToNothing');
      }, /Cannot render into unknown element/);
    });

    it('should not accept a number as input', function () {
      assert.throws(function () {
        makeDOMDriver(123);
      }, /Given container is not a DOM element neither a selector string/);
    });
  });

  describe('DOM Driver', function () {
    it('should throw if input is not an Observable<VTree>', function () {
      let domDriver = makeDOMDriver(createRenderTarget());
      assert.throws(function () {
        domDriver({});
      }, /The DOM driver function expects as input an Observable of virtual/);
    });

    it('should have Observable `:root` in response', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(
            h('div.top-most', [
              h('p', 'Foo'),
              h('span', 'Bar')
            ])
          )
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').skip(1).take(1).subscribe(root => {
        let classNameRegex = /top\-most/;
        assert.strictEqual(root.tagName, 'DIV');
        let child = root.children[0];
        assert.notStrictEqual(classNameRegex.exec(child.className), null);
        assert.strictEqual(classNameRegex.exec(child.className)[0], 'top-most');
        responses.dispose();
        done();
      });
    });

    it('should convert a simple virtual-dom <select> to DOM element', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(h('select.my-class', [
            h('option', {value: 'foo'}, 'Foo'),
            h('option', {value: 'bar'}, 'Bar'),
            h('option', {value: 'baz'}, 'Baz')
          ]))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        let selectEl = root.querySelector('.my-class');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'SELECT');
        responses.dispose();
        done();
      });
    });

    it('should convert a simple virtual-dom <select> (JSX) to DOM element', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(
            <select className="my-class">
              <option value="foo">Foo</option>
              <option value="bar">Bar</option>
              <option value="baz">Baz</option>
            </select>
          )
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        let selectEl = root.querySelector('.my-class');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'SELECT');
        responses.dispose();
        done();
      });
    });

    it('should allow plain virtual-dom Widgets in the VTree', function (done) {
      // The widget
      const MyTestWidget = function (content) {
        this.content = content;
      };
      MyTestWidget.prototype.type = 'Widget';
      MyTestWidget.prototype.init = function() {
        const divElem = document.createElement('H4');
        const textElem = document.createTextNode('Content is ' + this.content);
        divElem.appendChild(textElem);
        return divElem;
      }
      MyTestWidget.prototype.update = function(previous, domNode) {
        return null
      }

      // The Cycle.js app
      function app() {
        return {
          DOM: Rx.Observable.just(h('div.top-most', [
            h('p', 'Just a paragraph'),
            new MyTestWidget('hello world')
          ]))
        };
      }

      // Run it
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });

      // Assert it
      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        let selectEl = root.querySelector('h4');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'H4');
        assert.strictEqual(selectEl.textContent, 'Content is hello world');
        responses.dispose();
        done();
      });
    });

    it('should catch interaction events coming from wrapped View', function (done) {
      // Make a View reactively imitating another View
      function app() {
        return {
          DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      // Make assertions
      responses.DOM.get('.myelementclass', 'click').subscribe(ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.textContent, 'Foobar');
        responses.dispose();
        done();
      });
      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        let myElement = root.querySelector('.myelementclass');
        assert.notStrictEqual(myElement, null);
        assert.notStrictEqual(typeof myElement, 'undefined');
        assert.strictEqual(myElement.tagName, 'H3');
        assert.doesNotThrow(function () {
          myElement.click();
        });
      });
    });

    it('should catch interaction events using id in DOM.get', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget('parent-001'))
      });
      // Make assertions
      responses.DOM.get('#parent-001', 'click').subscribe(ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.textContent, 'Foobar');
        responses.dispose();
        done();
      });
      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        let myElement = root.querySelector('.myelementclass');
        assert.notStrictEqual(myElement, null);
        assert.notStrictEqual(typeof myElement, 'undefined');
        assert.strictEqual(myElement.tagName, 'H3');
        assert.doesNotThrow(function () {
          myElement.click();
        });
      });
    });

    it('should catch user events using DOM.select().events()', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      // Make assertions
      responses.DOM.select('.myelementclass').events('click').subscribe(ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.textContent, 'Foobar');
        responses.dispose();
        done();
      });
      responses.DOM.select(':root').observable.skip(1).take(1)
        .subscribe(function (root) {
          let myElement = root.querySelector('.myelementclass');
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function () {
            myElement.click();
          });
        });
    });

    it('should catch events from many elements using DOM.select().events()', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(h('div.parent', [
            h('h4.clickable.first', 'First'),
            h('h4.clickable.second', 'Second'),
          ]))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      let clicks = [];
      // Make assertions
      responses.DOM.select('.clickable').events('click').elementAt(0)
        .subscribe(ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'First');
        });
      responses.DOM.select('.clickable').events('click').elementAt(1)
        .subscribe(ev => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual(ev.target.textContent, 'Second');
          responses.dispose();
          done();
        });
      responses.DOM.select(':root').observable.skip(1).take(1)
        .subscribe(function (root) {
          let firstElem = root.querySelector('.first');
          let secondElem = root.querySelector('.second');
          assert.notStrictEqual(firstElem, null);
          assert.notStrictEqual(typeof firstElem, 'undefined');
          assert.notStrictEqual(secondElem, null);
          assert.notStrictEqual(typeof secondElem, 'undefined');
          assert.doesNotThrow(function () {
            firstElem.click();
            setTimeout(() => secondElem.click(), 1);
          });
        });
    });

    it('should catch interaction events using id in DOM.select', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget('parent-002'))
      });
      // Make assertions
      responses.DOM.select('#parent-002').events('click').subscribe(ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.textContent, 'Foobar');
        responses.dispose();
        done();
      });
      responses.DOM.select(':root').observable.skip(1).take(1)
        .subscribe(function (root) {
          let myElement = root.querySelector('.myelementclass');
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function () {
            myElement.click();
          });
        });
    });

    describe('DOM.select()', function () {
      it('should be an object with observable and events()', function (done) {
        function app() {
          return {
            DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
          };
        }
        let [requests, responses] = Cycle.run(app, {
          DOM: makeDOMDriver(createRenderTarget())
        });
        // Make assertions
        const selection = responses.DOM.select('.myelementclass');
        assert.strictEqual(typeof selection, 'object');
        assert.strictEqual(typeof selection.observable, 'object');
        assert.strictEqual(typeof selection.observable.subscribe, 'function');
        assert.strictEqual(typeof selection.events, 'function');
        responses.dispose();
        done();
      });

      it('should have an observable of DOM elements', function (done) {
        function app() {
          return {
            DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
          };
        }
        let [requests, responses] = Cycle.run(app, {
          DOM: makeDOMDriver(createRenderTarget())
        });
        // Make assertions
        responses.DOM.select('.myelementclass').observable.skip(1).take(1)
          .subscribe(elem => {
            assert.notStrictEqual(elem, null);
            assert.notStrictEqual(typeof elem, 'undefined');
            // Is a NodeList
            assert.strictEqual(Array.isArray(elem), false);
            assert.strictEqual(elem.length, 1);
            // NodeList with the H3 element
            assert.strictEqual(elem[0].tagName, 'H3');
            assert.strictEqual(elem[0].textContent, 'Foobar');
            responses.dispose();
            done();
          });
      });
    });

    it('should allow subscribing to interactions', function (done) {
      // Make a View reactively imitating another View
      function app() {
        return {
          DOM: Rx.Observable.just(h('h3.myelementclass', 'Foobar'))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get('.myelementclass', 'click').subscribe(ev => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual(ev.target.textContent, 'Foobar');
        responses.dispose();
        done();
      });
      // Make assertions
      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        let myElement = root.querySelector('.myelementclass');
        assert.notStrictEqual(myElement, null);
        assert.notStrictEqual(typeof myElement, 'undefined');
        assert.strictEqual(myElement.tagName, 'H3');
        assert.doesNotThrow(function () {
          myElement.click();
        });
      });
    });

    it('should accept a view wrapping a custom element (#89)', function (done) {
      function app() {
        let number$ = Fixture89.makeModelNumber$();
        return {
          DOM: Fixture89.viewWithContainerFn(number$)
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget(), {
          'my-element': Fixture89.myElement
        })
      });

      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        setTimeout(() => {
          let myelement = root.querySelector('.myelementclass');
          assert.notStrictEqual(myelement, null);
          assert.strictEqual(myelement.tagName, 'H3');
          assert.strictEqual(myelement.textContent, '123');
        }, 100);
        setTimeout(() => {
          let myelement = root.querySelector('.myelementclass');
          assert.notStrictEqual(myelement, null);
          assert.strictEqual(myelement.tagName, 'H3');
          assert.strictEqual(myelement.textContent, '456');
          responses.dispose();
          done();
        }, 500);
      });
    });

    it('should reject a view with custom element as the root of vtree$', function (done) {
      function app() {
        let number$ = Fixture89.makeModelNumber$();
        return {
          DOM: Fixture89.viewWithoutContainerFn(number$)
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget(), {
          'my-element': Fixture89.myElement
        })
      });
      responses.DOM.get(':root').subscribeOnError(function (err) {
        assert.strictEqual(err.message,
          'Illegal to use a Cycle custom element as the root of a View.'
        );
        responses.dispose();
        done();
      });
    });

    it('should render a VTree with a child Observable<VTree>', function (done) {
      function app() {
        let child$ = Rx.Observable.just(
          h('h4.child', {}, 'I am a kid')
        ).delay(80);
        return {
          DOM: Rx.Observable.just(h('div.my-class', [
            h('p', {}, 'Ordinary paragraph'),
            child$
          ]))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        let selectEl = root.querySelector('.child');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'H4');
        assert.strictEqual(selectEl.textContent, 'I am a kid');
        responses.dispose();
        done();
      });
    });

    it('should render a VTree with a grandchild Observable<VTree>', function (done) {
      function app() {
        let grandchild$ = Rx.Observable
          .just(
            h('h4.grandchild', {}, [
              'I am a baby'
            ])
          )
          .delay(20);
        let child$ = Rx.Observable
          .just(
            h('h3.child', {}, [
              'I am a kid', grandchild$
            ])
          )
          .delay(80);
        return {
          DOM: Rx.Observable.just(h('div.my-class', [
            h('p', {}, 'Ordinary paragraph'),
            child$
          ]))
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').skip(1).take(1).subscribe(function (root) {
        let selectEl = root.querySelector('.grandchild');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'H4');
        assert.strictEqual(selectEl.textContent, 'I am a baby');
        responses.dispose();
        done();
      });
    });

    it('should not work after has been disposed', function (done) {
      let number$ = Rx.Observable.range(1, 3)
        .concatMap(x => Rx.Observable.just(x).delay(50));
      function app() {
        return {
          DOM: number$.map(number =>
              h('h3.target', String(number))
          )
        };
      }
      let [requests, responses] = Cycle.run(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });
      responses.DOM.get(':root').skip(1).subscribe(function (root) {
        let selectEl = root.querySelector('.target');
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'H3');
        assert.notStrictEqual(selectEl.textContent, '3');
        if (selectEl.textContent === '2') {
          responses.dispose();
          requests.dispose();
          setTimeout(() => {
            done();
          }, 100);
        }
      });
    });
  });
});
