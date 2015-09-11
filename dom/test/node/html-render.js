'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/core');
let CycleDOM = require('../../src/cycle-dom');
let {Rx} = Cycle;
let {h, makeHTMLDriver} = CycleDOM;

describe('HTML Driver', function () {
  it('should output HTML when given a simple vtree stream', function (done) {
    function app() {
      return {
        html: Rx.Observable.just(h('div.test-element', ['Foobar']))
      };
    }
    let [requests, responses] = Cycle.run(app, {
      html: makeHTMLDriver()
    });
    responses.html.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    });
  });

  it('should make bogus select().events() as requests', function (done) {
    function app({html}) {
      assert.strictEqual(typeof html.select, 'function');
      assert.strictEqual(typeof html.select('whatever').observable.subscribe, 'function');
      assert.strictEqual(typeof html.select('whatever').events().subscribe, 'function');
      return {
        html: Rx.Observable.just(h('div.test-element', ['Foobar']))
      };
    }
    let [requests, responses] = Cycle.run(app, {
      html: makeHTMLDriver()
    });
    responses.html.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    });
  });

  it('should output simple HTML Observable at `.get(\':root\')`', function (done) {
    function app() {
      return {
        html: Rx.Observable.just(h('div.test-element', ['Foobar']))
      };
    }
    let [requests, responses] = Cycle.run(app, {
      html: makeHTMLDriver()
    });
    responses.html.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    });
  });

  it('should render a simple nested custom element as HTML', function (done) {
    function myElement() {
      return {
        DOM: Rx.Observable.just(h('h3.myelementclass'))
      };
    }
    function app() {
      return {
        DOM: Rx.Observable.just(h('div.test-element', [h('my-element')]))
      };
    }
    let [requests, responses] = Cycle.run(app, {
      DOM: makeHTMLDriver({'my-element': myElement})
    });
    responses.DOM.subscribe(html => {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<h3 class="myelementclass"></h3>' +
        '</div>'
      );
      done();
    });
  });

  it('should render double nested custom elements as HTML', function (done) {
    function myElement() {
      return {
        html: Rx.Observable.just(h('h3.myelementclass'))
      };
    }
    function niceElement() {
      return {
        html: Rx.Observable.just(h('div.a-nice-element', [
          String('foobar'), h('my-element')
        ]))
      };
    }
    function app() {
      return {
        html: Rx.Observable.just(h('div.test-element', [h('nice-element')]))
      };
    }
    let customElements = {
      'my-element': myElement,
      'nice-element': niceElement
    };
    let html$ = Cycle.run(app, {
      html: makeHTMLDriver(customElements)
    })[1].html;

    html$.subscribe(html => {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<div class="a-nice-element">' +
            'foobar<h3 class="myelementclass"></h3>' +
          '</div>' +
        '</div>'
      );
      done();
    });
  });

  it('should HTML-render a nested custom element with props', function (done) {
    function myElement(ext) {
      return {
        DOM: ext.props.get('foobar')
          .map(foobar => h('h3.myelementclass', String(foobar).toUpperCase()))
      };
    }
    function app() {
      return {
        DOM: Rx.Observable.just(
          h('div.test-element', [
            h('my-element', {foobar: 'yes'})
          ])
        )
      };
    }
    let [requests, responses] = Cycle.run(app, {
      DOM: makeHTMLDriver({'my-element': myElement})
    });

    responses.DOM.subscribe(html => {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<h3 class="myelementclass">YES</h3>' +
        '</div>'
      );
      done();
    });
  });

  it('should HTML-render a nested custom element with props (2)', function (done) {
    function myElement(ext) {
      return {
        DOM: ext.props.get('*')
          .map(props => h('h3.myelementclass', String(props.foobar).toUpperCase()))
      };
    }
    function app() {
      return {
        DOM: Rx.Observable.just(
          h('div.test-element', [
            h('my-element', {foobar: 'yes'})
          ])
        )
      };
    }
    let [requests, responses] = Cycle.run(app, {
      DOM: makeHTMLDriver({'my-element': myElement})
    });

    responses.DOM.subscribe(html => {
      assert.strictEqual(html,
        '<div class="test-element">' +
        '<h3 class="myelementclass">YES</h3>' +
        '</div>'
      );
      done();
    });
  });

  it('should render a complex custom element tree as HTML', function (done) {
    function xFoo() {
      return {
        html: Rx.Observable.just(h('h1.fooclass'))
      };
    }
    function xBar() {
      return {
        html: Rx.Observable.just(h('h2.barclass'))
      };
    }
    function app() {
      return {
        html: Rx.Observable.just(
          h('.test-element', [
            h('div', [
              h('h2.a', 'a'),
              h('h4.b', 'b'),
              h('x-foo')
            ]),
            h('div', [
              h('h3.c', 'c'),
              h('div', [
                h('p.d', 'd'),
                h('x-bar')
              ])
            ])
          ])
        )
      };
    }
    let [requests, responses] = Cycle.run(app, {
      html: makeHTMLDriver({
        'x-foo': xFoo,
        'x-bar': xBar
      })
    });

    responses.html.subscribe(html => {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<div>' +
            '<h2 class="a">a</h2>' +
            '<h4 class="b">b</h4>' +
            '<h1 class="fooclass"></h1>' +
          '</div>' +
          '<div>' +
            '<h3 class="c">c</h3>' +
            '<div>' +
              '<p class="d">d</p>' +
              '<h2 class="barclass"></h2>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      done();
    });
  });
});
