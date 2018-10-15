import * as assert from 'assert';
import {Observable, of} from 'rxjs';
import {mergeAll} from 'rxjs/operators';
import {setup} from '@cycle/rxjs-run';
import {HTTPSource, makeHTTPDriver} from '../src/rxjs';
import {runTests} from './browser/common';
import {globalSandbox} from './support/global';
import {startServer} from './support/server';

declare const process: any;
process.env.PORT = 5000;
startServer();
const uri = 'http://localhost:5000';
runTests(uri);

describe('HTTP Driver in Node.js', function() {
  it('should auto-execute HTTP request when without listening to response stream', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: uri + '/pet',
          method: 'POST',
          send: {name: 'Woof', species: 'Dog'},
        }),
      };
    }

    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});
    globalSandbox.petPOSTResponse = null;
    run();

    setTimeout(function() {
      assert.notStrictEqual(globalSandbox.petPOSTResponse, null);
      assert.strictEqual(globalSandbox.petPOSTResponse, 'added Woof the Dog');
      globalSandbox.petPOSTResponse = null;
      done();
    }, 250);
  });

  it('should not auto-execute lazy request without listening to response stream', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: uri + '/pet',
          method: 'POST',
          send: {name: 'Woof', species: 'Dog'},
          lazy: true,
        }),
      };
    }

    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});
    globalSandbox.petPOSTResponse = null;
    run();

    setTimeout(function() {
      assert.strictEqual(globalSandbox.petPOSTResponse, null);
      done();
    }, 250);
  });

  it('should execute lazy HTTP request when listening to response stream', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: uri + '/pet',
          method: 'POST',
          send: {name: 'Woof', species: 'Dog'},
          lazy: true,
        }),
      };
    }

    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});
    globalSandbox.petPOSTResponse = null;

    sources.HTTP.select()
      .pipe(mergeAll())
      .subscribe();

    run();

    setTimeout(function() {
      assert.notStrictEqual(globalSandbox.petPOSTResponse, null);
      assert.strictEqual(globalSandbox.petPOSTResponse, 'added Woof the Dog');
      globalSandbox.petPOSTResponse = null;
      done();
    }, 250);
  });

  it('should add request options object to each response', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: uri + '/pet',
          method: 'POST',
          send: {name: 'Woof', species: 'Dog'},
          _id: 'petRequest',
        }),
      };
    }

    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

    sources.HTTP.select()
      .pipe(mergeAll())
      .subscribe(function(r: any) {
        assert.ok(r.request);
        assert.strictEqual(r.request._id, 'petRequest');
        done();
      });

    run();
  });

  it('should handle errors when sending request to non-existent server', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: 'http://localhost:9999', // no server here
          category: 'noServerCat',
          _id: 'petRequest',
        }),
      };
    }

    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

    sources.HTTP.select()
      .pipe(mergeAll())
      .subscribe({
        next: function(r: any) {
          done('next() should not be called');
        },
        error: function(err: any) {
          assert.strictEqual(err.code, 'ECONNREFUSED');
          assert.strictEqual(err.port, 9999);
          done();
        },
      });

    run();
  });

  it('should call next() when ok is specified for an error status', function(done) {
    function main(_sources: {HTTP: HTTPSource}) {
      return {
        HTTP: of({
          url: uri + '/not-found-url',
          method: 'GET',
          ok: (res: any) => res.status === 404,
        }),
      };
    }

    const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

    sources.HTTP.select()
      .pipe(mergeAll())
      .subscribe({
        next: function(r: any) {
          assert.ok(r.request);
          assert.strictEqual(r.status, 404);
          done();
        },
        error: function(err: any) {
          done('error() should not be called');
        },
      });

    run();
  });
});
