const timeDriver = require(__dirname);
const xs = require('xstream').default;
const dom = require('@cycle/dom');

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
    '@cycle/xstream-run': require('@cycle/xstream-run'),
    '@cycle/xstream-adapter': require('@cycle/xstream-adapter'),
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

    done: (err) => {
      if (err) {
        throw err;
      }
    },

    console: {
      error () {},
      log () {}
    },

    xs,

    div,
    button
  }
}
