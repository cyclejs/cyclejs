'use strict';

var uri = 'http://localhost:5000';
process.env.PORT = 5000;
require('./support/server');
require('./common')(uri);

// Node.js specific ============================================================
var assert = require('assert');
var Rx = require('rxjs');
var Cycle = require('@cycle/rxjs-run').default;
var src = require('../lib/index');
var makeHTTPDriver = src.makeHTTPDriver;
var globalSandbox = require('./support/global');

describe('HTTP Driver in Node.js', function () {
  it('should auto-execute HTTP request when without listening to response stream',
    function(done) {
      function main() {
        return {
          HTTP: Rx.Observable.of({
            url: uri + '/pet',
            method: 'POST',
            send: {name: 'Woof', species: 'Dog'}
          })
        }
      }

      var output = Cycle(main, { HTTP: makeHTTPDriver() });
      globalSandbox.petPOSTResponse = null;
      output.run();

      setTimeout(function () {
        assert.notStrictEqual(globalSandbox.petPOSTResponse, null);
        assert.strictEqual(globalSandbox.petPOSTResponse, 'added Woof the Dog');
        globalSandbox.petPOSTResponse = null;
        done();
      }, 250);
    }
  );

  it('should not auto-execute lazy request without listening to response stream',
    function(done) {
      function main() {
        return {
          HTTP: Rx.Observable.of({
            url: uri + '/pet',
            method: 'POST',
            send: {name: 'Woof', species: 'Dog'},
            lazy: true
          })
        }
      }

      var output = Cycle(main, { HTTP: makeHTTPDriver() });
      globalSandbox.petPOSTResponse = null;
      output.run();

      setTimeout(function () {
        assert.strictEqual(globalSandbox.petPOSTResponse, null);
        done();
      }, 250);
    }
  );

  it('should execute lazy HTTP request when listening to response stream',
    function(done) {
      function main() {
        return {
          HTTP: Rx.Observable.of({
            url: uri + '/pet',
            method: 'POST',
            send: {name: 'Woof', species: 'Dog'},
            lazy: true
          })
        }
      }

      var output = Cycle(main, { HTTP: makeHTTPDriver() });
      globalSandbox.petPOSTResponse = null;

      output.sources.HTTP.select()
        .mergeAll()
        .subscribe();

      output.run();

      setTimeout(function () {
        assert.notStrictEqual(globalSandbox.petPOSTResponse, null);
        assert.strictEqual(globalSandbox.petPOSTResponse, 'added Woof the Dog');
        globalSandbox.petPOSTResponse = null;
        done();
      }, 250);
    }
  );

  it('should add request options object to each response',
    function(done) {
      function main() {
        return {
          HTTP: Rx.Observable.of({
            url: uri + '/pet',
            method: 'POST',
            send: {name: 'Woof', species: 'Dog'},
            _id: 'petRequest'
          })
        }
      }

      var output = Cycle(main, { HTTP: makeHTTPDriver() });

      output.sources.HTTP.select()
        .mergeAll()
        .subscribe(function (r) {
          assert.ok(r.request);
          assert.strictEqual(r.request._id, 'petRequest');
          done();
        });

      output.run();
    }
  );
});
