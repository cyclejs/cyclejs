let xs = require(`xstream`).default
let jsonp = require(`jsonp`)
let xsSA = require(`cycle-monorepo-sandbox-xstream-adapter`).default

function createResponse$(url) {
  return xs.create({
    start: listener => {
      if (typeof url !== `string`) {
        listener.error(new Error(`Observable of requests given to JSONP ` +
          `Driver must emit URL strings.`))
      }

      try {
        jsonp(url, (err, res) => {
          if (err) {
            listener.error(err)
          } else {
            listener.next(res)
            listener.complete()
          }
        })
      } catch (err) {
        listener.error(err)
      }
    },
    stop: () => {},
  })
}

function makeJSONPDriver() {
  function jsonpDriver(request$) {
    return request$.map(url => {
      let response$ = createResponse$(url)
      response$.request = url
      return response$
    })
  }
  jsonpDriver.streamAdapter = xsSA
  return jsonpDriver
}

module.exports = {
  /**
   * JSONP Driver factory.
   *
   * This is a function which, when called, returns a JSONP Driver for Cycle.js
   * apps. The driver is also a function, and it takes a stream of requests
   * (URL strings) as input, and generates a metastream of responses.
   *
   * **Requests**. The stream of requests should emit strings as the URL of the
   * remote resource over HTTP.
   *
   * **Responses**. A metastream is a stream of streams. The response metastream
   * emits streams of responses. These streams of responses have a `request`
   * field attached to them (to the stream object itself) indicating which
   * request (from the driver input) generated this response stream. The
   * response streams themselves emit the response object received through the
   * npm `jsonp` package.
   *
   * @return {Function} the JSONP Driver function
   * @function makeJSONPDriver
   */
  makeJSONPDriver,
}
