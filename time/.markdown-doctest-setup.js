const timeDriver = require('./lib/');
const xs = require('xstream').default;
const dom = require('@cycle/dom');
const most = require('most');
const {Observable} = require('rxjs/Rx');

const {div, button} = dom;

const mockedCycleDom = {
  makeDOMDriver () {
    return function driver (sink$) {
      return {
        select () {
          return {
            events (){
              return xs.empty();
            }
          }
        }
      }
    }
  },

  mockDOMSource: dom.mockDOMSource,

  div,

  button
}

function Counter ({DOM}) {
  const add$ = DOM
    .select('.add')
    .events('click')
    .mapTo(+1);

  const subtract$ = DOM
    .select('.subtract')
    .events('click')
    .mapTo(-1);

  const change$ = xs.merge(add$, subtract$);

  const count$ = change$.fold((total, change) => total + change, 0);

  return {
    DOM: count$.map(count =>
      div('.counter', [
        div('.count', count.toString()),
        button('.add', 'Add'),
        button('.subtract', 'Subtract')
      ])
    )
  }
}

module.exports = {
  require: {
    '@cycle/time': {
      timeDriver: timeDriver.mockTimeSource,

      mockTimeSource: timeDriver.mockTimeSource
    },
    '@cycle/dom': mockedCycleDom,
    'snabbdom-selector': require('snabbdom-selector'),
    'xstream': require('xstream'),

    '../src/counter': {Counter},

    assert: require('assert')
  },

  regexRequire: {
    'xstream\/(.*)': function (fullMatch, module) {
      return require(`xstream/${module}`)
    }
  },

  globals: {
    document: {
      querySelector () {
        return [];
      }
    },

    Time: timeDriver.mockTimeSource(),
    timeDriver: timeDriver.timeDriver,
    mockTimeSource: timeDriver.mockTimeSource,

    done: (err) => {
      if (err) {
        throw err;
      }
    },

    console: {
      error () {},
      log () {}
    },

    makeDOMDriver: mockedCycleDom.makeDOMDriver,
    DOM: mockedCycleDom.makeDOMDriver()(),

    xs,
    Observable,
    most,

    div,
    button,
    describe: (label, itBlock) => itBlock(),
    it: (label, test) => {
      const done = () => {};

      test(done);
    },
    run: (main, drivers) => {}
  },
}
