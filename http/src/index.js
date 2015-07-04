'use strict';
let {makeHTTPDriver} = require('./http-driver');

module.exports = {
  /**
   * HTTP Driver factory. This is a function which, when called, returns a HTTP
   * Driver for Cycle.js apps. The driver is also a function, and it takes an 
   * Observable of requests as input, and generates a metastream of responses. A 
   * metastream is an Observable of Observables. The response metastream emits 
   * Observables of responses. These Observables of responses have a `request` 
   * field attached to them (to the Observable object itself) indicating which 
   * request (from the driver input) generated this response Observable. The 
   * response Observables themselves emit the response object received through 
   * superagent.
   *
   * @return {Function} the HTTP Driver function
   * @function makeHTTPDriver
   */
  makeHTTPDriver
};
