const timeDriver = require('./dist/src/time-driver.js');
const xs = require('xstream');

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
  }
}

module.exports = {
  require: {
    '@cycle/time': timeDriver,
    '@cycle/dom': mockedCycleDom,
    '@cycle/xstream-run': require('@cycle/xstream-run')
  },

  globals: {
    document: {
      querySelector () {
        return [];
      }
    },

    Time: timeDriver.makeTimeDriver()(),

    done: (err) => {
      if (err) {
        throw err;
      }
    },

    console: {
      error () {},
      log () {}
    }
  }
}
