'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/core/cycle');
let {Rx, h} = Cycle;
let CustomElements = require('../../src/web/custom-elements');

describe('renderAsHTML()', function () {
  //beforeEach(function () {
  //  CustomElements.unregisterAllCustomElements();
  //});

  it('should output HTML when given a simple vtree stream', function (done) {
    function app() {
      return {
        html: Rx.Observable.just(h('div.test-element', ['Foobar']))
      };
    }
    let [appOutput, htmlOutput] = Cycle.run(app, {
      html: Cycle.makeHTMLAdapter()
    });
    htmlOutput.get('html').subscribe(function (html) {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    });
  });

  it('should render a simple nested custom element as HTML', function (done) {
    function myElement() {
      return {
        dom: Rx.Observable.just(h('h3.myelementclass'))
      };
    }
    function app() {
      return {
        dom: Rx.Observable.just(h('div.test-element', [h('my-element')]))
      };
    }
    let [appOutput, htmlOutput] = Cycle.run(app, {
      dom: Cycle.makeHTMLAdapter({'my-element': myElement})
    });
    htmlOutput.get('dom').subscribe(function (html) {
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
      html: Cycle.makeHTMLAdapter(customElements)
    })[1].get('html');

    html$.subscribe(function (html) {
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
        DOM: ext.get('props', 'foobar')
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
    let [appOutput, htmlOutput] = Cycle.run(app, {
      DOM: Cycle.makeHTMLAdapter({'my-element': myElement})
    });

    htmlOutput.get('DOM').subscribe(function (html) {
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
    let [appOutput, htmlOutput] = Cycle.run(app, {
      html: Cycle.makeHTMLAdapter({
        'x-foo': xFoo,
        'x-bar': xBar
      })
    });

    htmlOutput.get('html').subscribe(function (html) {
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
