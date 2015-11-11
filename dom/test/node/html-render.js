'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/core');
let CycleDOM = require('../../src/cycle-dom');
let Rx = require('rx');
let {div, h3, h, makeHTMLDriver} = CycleDOM;

describe('HTML Driver', function () {
  it('should output HTML when given a simple vtree stream', function (done) {
    function app() {
      return {
        html: Rx.Observable.just(div('.test-element', ['Foobar']))
      };
    }
    let [sinks, sources] = Cycle.run(app, {
      html: makeHTMLDriver()
    });
    sources.html.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    });
  });

  it('should make bogus select().events() as sources', function (done) {
    function app({html}) {
      assert.strictEqual(typeof html.select, 'function');
      assert.strictEqual(typeof html.select('whatever').observable.subscribe, 'function');
      assert.strictEqual(typeof html.select('whatever').events().subscribe, 'function');
      return {
        html: Rx.Observable.just(div('.test-element', ['Foobar']))
      };
    }
    let [sinks, sources] = Cycle.run(app, {
      html: makeHTMLDriver()
    });
    sources.html.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    });
  });

  it('should output simple HTML Observable', function (done) {
    function app() {
      return {
        html: Rx.Observable.just(div('.test-element', ['Foobar']))
      };
    }
    let [sinks, sources] = Cycle.run(app, {
      html: makeHTMLDriver()
    });
    sources.html.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    });
  });

  it('should render a simple nested vtree$ as HTML', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.just(h('div.test-element', [
          Rx.Observable.just(h('h3.myelementclass'))
        ]))
      };
    }
    let [sinks, sources] = Cycle.run(app, {
      DOM: makeHTMLDriver()
    });
    sources.DOM.subscribe(html => {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<h3 class="myelementclass"></h3>' +
        '</div>'
      );
      done();
    });
  });

  it('should render double nested vtree$ as HTML', function (done) {
    function app() {
      return {
        html: Rx.Observable.just(h('div.test-element', [
          Rx.Observable.just(h('div.a-nice-element', [
            String('foobar'),
            Rx.Observable.just(h('h3.myelementclass'))
          ]))
        ]))
      };
    }
    let html$ = Cycle.run(app, {
      html: makeHTMLDriver()
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

  it('should HTML-render a nested vtree$ with props', function (done) {
    function myElement(foobar$) {
      return foobar$.map(foobar =>
        h('h3.myelementclass', String(foobar).toUpperCase())
      );
    }
    function app() {
      return {
        DOM: Rx.Observable.just(
          h('div.test-element', [
            myElement(Rx.Observable.just('yes'))
          ])
        )
      };
    }
    let [sinks, sources] = Cycle.run(app, {
      DOM: makeHTMLDriver()
    });

    sources.DOM.subscribe(html => {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<h3 class="myelementclass">YES</h3>' +
        '</div>'
      );
      done();
    });
  });

  it('should render a complex and nested vtree$ as HTML', function (done) {
    function app() {
      return {
        html: Rx.Observable.just(
          h('.test-element', [
            h('div', [
              h('h2.a', 'a'),
              h('h4.b', 'b'),
              Rx.Observable.just(h('h1.fooclass'))
            ]),
            h('div', [
              h('h3.c', 'c'),
              h('div', [
                h('p.d', 'd'),
                Rx.Observable.just(h('h2.barclass'))
              ])
            ])
          ])
        )
      };
    }
    let [sinks, sources] = Cycle.run(app, {
      html: makeHTMLDriver()
    });

    sources.html.subscribe(html => {
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
