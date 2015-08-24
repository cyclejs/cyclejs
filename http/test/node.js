'use strict';

var uri = 'http://localhost:5000';
process.env.ZUUL_PORT = 5000;
require('./support/server');
require('./common')(uri);

// Node.js specific ============================================================
var assert = require('assert');
var Cycle = require('@cycle/core');
var src = require('../lib/index');
var makeHTTPDriver = src.makeHTTPDriver;
var globalSandbox = require('./support/global');

describe('HTTP Driver in Node.js', function () {
  it('should auto-execute HTTP request when factory gets autoSubscribe = true',
    function(done) {
      var request$ = Cycle.Rx.Observable.just({
        url: uri + '/pet',
        method: 'POST',
        send: {name: 'Woof', species: 'Dog'}
      });
      var httpDriver = makeHTTPDriver({autoSubscribe: true});
      globalSandbox.petPOSTResponse = null;
      httpDriver(request$);
      setTimeout(function () {
        assert.notStrictEqual(globalSandbox.petPOSTResponse, null);
        assert.strictEqual(globalSandbox.petPOSTResponse, 'added Woof the Dog');
        globalSandbox.petPOSTResponse = null;
        done();
      }, 100);
    }
  );

  it('should auto-execute HTTP request by default',
    function(done) {
      var request$ = Cycle.Rx.Observable.just({
        url: uri + '/pet',
        method: 'POST',
        send: {name: 'Woof', species: 'Dog'}
      });
      var httpDriver = makeHTTPDriver();
      globalSandbox.petPOSTResponse = null;
      httpDriver(request$);
      setTimeout(function () {
        assert.notStrictEqual(globalSandbox.petPOSTResponse, null);
        assert.strictEqual(globalSandbox.petPOSTResponse, 'added Woof the Dog');
        globalSandbox.petPOSTResponse = null;
        done();
      }, 100);
    }
  );

  it('should not auto-execute HTTP request when factory gets autoSubscribe = false',
    function(done) {
      var request$ = Cycle.Rx.Observable.just({
        url: uri + '/pet',
        method: 'POST',
        send: {name: 'Woof', species: 'Dog'}
      });
      var httpDriver = makeHTTPDriver({autoSubscribe: false});
      globalSandbox.petPOSTResponse = null;
      httpDriver(request$);
      setTimeout(function () {
        assert.strictEqual(globalSandbox.petPOSTResponse, null);
        done();
      }, 100);
    }
  );
});
