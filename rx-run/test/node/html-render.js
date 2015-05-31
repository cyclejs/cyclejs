'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('../../src/core/cycle');
let {Rx, h} = Cycle;
let CustomElements = require('../../src/web/custom-elements');

describe('renderAsHTML()', function () {
  beforeEach(function () {
    CustomElements.unregisterAllCustomElements();
  });

  it('should output HTML when given a simple vtree stream', function (done) {
    let vtree$ = Rx.Observable.just(h('div.test-element', ['Foobar']));
    let html$ = Cycle.renderAsHTML(vtree$);
    html$.subscribe(function (html) {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    });
  });

  it('should render a simple nested custom element as HTML', function (done) {
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    var vtree$ = Rx.Observable.just(
      h('div.test-element', [
        h('myelement')
      ])
    );
    let html$ = Cycle.renderAsHTML(vtree$);
    html$.subscribe(function (html) {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<h3 class="myelementclass"></h3>' +
        '</div>'
      );
      done();
    });
  });

  it('should render double nested custom elements as HTML', function (done) {
    Cycle.registerCustomElement('myelement', function () {
      return {
        vtree$: Rx.Observable.just(h('h3.myelementclass'))
      };
    });
    Cycle.registerCustomElement('nice-element', function () {
      return {
        vtree$: Rx.Observable.just(h('div.a-nice-element', [
          String('foobar'), h('myelement')
        ]))
      };
    });
    var vtree$ = Rx.Observable.just(h('div.test-element', [h('nice-element')]));
    let html$ = Cycle.renderAsHTML(vtree$);
    html$.subscribe(function (html) {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<div class="a-nice-element">foobar<h3 class="myelementclass"></h3></div>' +
        '</div>'
      );
      done();
    });
  });

  it('should render a nested custom element with props as HTML', function (done) {
    Cycle.registerCustomElement('myelement', function (interactions, props) {
      return {
        vtree$: props.get('foobar')
          .map(foobar => h('h3.myelementclass', String(foobar).toUpperCase()))
      };
    });
    var vtree$ = Rx.Observable.just(
      h('div.test-element', [
        h('myelement', {foobar: 'yes'})
      ])
    );
    let html$ = Cycle.renderAsHTML(vtree$);
    html$.subscribe(function (html) {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<h3 class="myelementclass">YES</h3>' +
        '</div>'
      );
      done();
    });
  });

  it('should render a complex custom element tree as HTML', function (done) {
    Cycle.registerCustomElement('x-foo', function () {
      return {
        vtree$: Rx.Observable.just(h('h1.fooclass'))
      };
    });
    Cycle.registerCustomElement('x-bar', function () {
      return {
        vtree$: Rx.Observable.just(h('h2.barclass'))
      };
    });
    var vtree$ = Rx.Observable.just(
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
    );
    let html$ = Cycle.renderAsHTML(vtree$);
    html$.subscribe(function (html) {
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
