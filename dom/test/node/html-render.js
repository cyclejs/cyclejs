'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/rxjs-run').default;
let CycleDOM = require('../../lib/index');
let Rx = require('rxjs');
let {div, h3, h, makeHTMLDriver} = CycleDOM;

describe('HTML Driver', function () {
  it('should output HTML when given a simple vtree stream', function (done) {
    function app() {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar']))
      };
    }

    function effect(html) {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    let {sinks, sources, run} = Cycle(app, {
      html: makeHTMLDriver(effect),
    });
    run()
  });

  it('should allow effect to see one or many HTML outputs', function (done) {
    function app() {
      return {
        html: Rx.Observable.interval(150).take(3).map(i =>
          div('.test-element', ['Foobar' + i])
        )
      };
    }

    var expected = [
      '<div class="test-element">Foobar0</div>',
      '<div class="test-element">Foobar1</div>',
      '<div class="test-element">Foobar2</div>',
    ]

    function effect(html) {
      assert.strictEqual(html, expected.shift());
      if (expected.length === 0) {
        done();
      }
    }

    let {sinks, sources, run} = Cycle(app, {
      html: makeHTMLDriver(effect),
    });
    run()
  });

  it('should allow effect to see one (the last) HTML outputs', function (done) {
    function app() {
      return {
        html: Rx.Observable.interval(150).take(3).map(i =>
          div('.test-element', ['Foobar' + i])
        ).last()
      };
    }

    function effect(html) {
      assert.strictEqual(html, '<div class="test-element">Foobar2</div>');
      done();
    }

    let {sinks, sources, run} = Cycle(app, {
      html: makeHTMLDriver(effect),
    });
    run()
  });

  it('should output HTMLSource as an adapted stream', function (done) {
    function app() {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar']))
      };
    }
    let {sinks, sources, run} = Cycle(app, {
      html: makeHTMLDriver()
    });
    assert.strictEqual(typeof sources.html.elements().lift, 'function');
    assert.strictEqual(typeof sources.html.elements().debounceTime, 'function');
    assert.strictEqual(typeof sources.html.elements().switchMap, 'function');
    done();
  });

  it('should have DevTools flag in HTMLSource elements() stream', function (done) {
    function app() {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar']))
      };
    }
    let {sinks, sources, run} = Cycle(app, {
      html: makeHTMLDriver()
    });
    assert.strictEqual(sources.html.elements()._isCycleSource, 'html');
    done();
  });

  it('should have DevTools flag in HTMLSource elements() stream', function (done) {
    function app() {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar']))
      };
    }
    let {sinks, sources, run} = Cycle(app, {
      html: makeHTMLDriver()
    });
    assert.strictEqual(sources.html.events('click')._isCycleSource, 'html');
    done();
  });

  it('should make bogus select().events() as sources', function (done) {
    function app({html}) {
      assert.strictEqual(typeof html.select, 'function');
      assert.strictEqual(typeof html.select('whatever').elements().subscribe, 'function');
      assert.strictEqual(typeof html.select('whatever').events().subscribe, 'function');
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar']))
      };
    }

    function effect(html) {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    let {sinks, sources, run} = Cycle(app, {
      html: makeHTMLDriver(effect),
    });
    run();
  });

  it('should output simple HTML Observable', function (done) {
    function app() {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar']))
      };
    }

    function effect(html) {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    let {sinks, sources, run} = Cycle(app, {
      html: makeHTMLDriver(effect),
    });
    run();
  });

  describe('with transposition=true', function () {
    it('should render a simple nested vtree$ as HTML', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.of(h('div.test-element', [
            Rx.Observable.of(h('h3.myelementclass'))
          ]))
        };
      }

      function effect(html) {
        assert.strictEqual(html,
          '<div class="test-element">' +
            '<h3 class="myelementclass"></h3>' +
          '</div>'
        );
        done();
      }

      let {sink, sources, run} = Cycle(app, {
        DOM: makeHTMLDriver(effect, {transposition: true})
      });
      run()
    });

    it('should render double nested vtree$ as HTML', function (done) {
      function app() {
        return {
          html: Rx.Observable.of(h('div.test-element', [
            Rx.Observable.of(h('div.a-nice-element', [
              String('foobar'),
              Rx.Observable.of(h('h3.myelementclass'))
            ]))
          ]))
        };
      }

      function effect(html) {
        assert.strictEqual(html,
          '<div class="test-element">' +
            '<div class="a-nice-element">' +
              'foobar<h3 class="myelementclass"></h3>' +
            '</div>' +
          '</div>'
        );
        done();
      }

      let {sinks, sources, run} = Cycle(app, {
        html: makeHTMLDriver(effect, {transposition: true})
      })

      run()
    });

    it('should HTML-render a nested vtree$ with props', function (done) {
      function myElement(foobar$) {
        return foobar$.map(foobar =>
          h('h3.myelementclass', String(foobar).toUpperCase())
        );
      }
      function app() {
        return {
          DOM: Rx.Observable.of(
            h('div.test-element', [
              myElement(Rx.Observable.of('yes'))
            ])
          )
        };
      }

      function effect(html) {
        assert.strictEqual(html,
          '<div class="test-element">' +
            '<h3 class="myelementclass">YES</h3>' +
          '</div>'
        );
        done();
      }

      let {sink, sources, run} = Cycle(app, {
        DOM: makeHTMLDriver(effect, {transposition: true})
      });

      run()
    });

    it('should render a complex and nested vtree$ as HTML', function (done) {
      function app() {
        return {
          html: Rx.Observable.of(
            h('.test-element', [
              h('div', [
                h('h2.a', 'a'),
                h('h4.b', 'b'),
                Rx.Observable.of(h('h1.fooclass'))
              ]),
              h('div', [
                h('h3.c', 'c'),
                h('div', [
                  h('p.d', 'd'),
                  Rx.Observable.of(h('h2.barclass'))
                ])
              ])
            ])
          )
        };
      }

      function effect(html) {
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
      }

      let {sink, sources, run} = Cycle(app, {
        html: makeHTMLDriver(effect, {transposition: true})
      });

      run();
    });
  });
});
