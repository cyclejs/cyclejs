import * as assert from 'assert';
import * as Rx from 'rxjs';
import * as Cycle from '@cycle/rxjs-run';
import {makeHTTPDriver} from '../lib/index';
import {HTTPSource} from '../rxjs-typings';
import {run as runCommon} from './browser/src/common';
import {globalSandbox} from './support/global';
import {startServer} from './support/server';

declare const process: any;
process.env.PORT = 5000;
startServer();
const uri = 'http://localhost:5000';
runCommon(uri);

describe('HTTP Driver in Node.js', function() {
  it('should auto-execute HTTP request when without listening to response stream', function(
    done,
  ) {
    function main(sources: {HTTP: HTTPSource}) {
      return {
        HTTP: Rx.Observable.of({
          url: uri + '/pet',
          method: 'POST',
          send: {name: 'Woof', species: 'Dog'},
        }),
      };
    }

    const {sources, run} = Cycle.setup(main, {HTTP: makeHTTPDriver()});
    globalSandbox.petPOSTResponse = null;
    run();

    setTimeout(function() {
      assert.notStrictEqual(globalSandbox.petPOSTResponse, null);
      assert.strictEqual(globalSandbox.petPOSTResponse, 'added Woof the Dog');
      globalSandbox.petPOSTResponse = null;
      done();
    }, 250);
  });

  it('should not auto-execute lazy request without listening to response stream', function(
    done,
  ) {
    function main(sources: {HTTP: HTTPSource}) {
      return {
        HTTP: Rx.Observable.of({
          url: uri + '/pet',
          method: 'POST',
          send: {name: 'Woof', species: 'Dog'},
          lazy: true,
        }),
      };
    }

    const {sources, run} = Cycle.setup(main, {HTTP: makeHTTPDriver()});
    globalSandbox.petPOSTResponse = null;
    run();

    setTimeout(function() {
      assert.strictEqual(globalSandbox.petPOSTResponse, null);
      done();
    }, 250);
  });

  it('should execute lazy HTTP request when listening to response stream', function(
    done,
  ) {
    function main(sources: {HTTP: HTTPSource}) {
      return {
        HTTP: Rx.Observable.of({
          url: uri + '/pet',
          method: 'POST',
          send: {name: 'Woof', species: 'Dog'},
          lazy: true,
        }),
      };
    }

    const {sources, run} = Cycle.setup(main, {HTTP: makeHTTPDriver()});
    globalSandbox.petPOSTResponse = null;

    sources.HTTP.select().mergeAll().subscribe();

    run();

    setTimeout(function() {
      assert.notStrictEqual(globalSandbox.petPOSTResponse, null);
      assert.strictEqual(globalSandbox.petPOSTResponse, 'added Woof the Dog');
      globalSandbox.petPOSTResponse = null;
      done();
    }, 250);
  });

  it('should add request options object to each response', function(done) {
    function main(sources: {HTTP: HTTPSource}) {
      return {
        HTTP: Rx.Observable.of({
          url: uri + '/pet',
          method: 'POST',
          send: {name: 'Woof', species: 'Dog'},
          _id: 'petRequest',
        }),
      };
    }

    const {sources, run} = Cycle.setup(main, {HTTP: makeHTTPDriver()});

    sources.HTTP.select().mergeAll().subscribe(function(r) {
      assert.ok(r.request);
      assert.strictEqual((r.request as any)._id, 'petRequest');
      done();
    });

    run();
  });

  it('should handle errors when sending request to non-existent server', function(
    done,
  ) {
    function main(sources: {HTTP: HTTPSource}) {
      return {
        HTTP: Rx.Observable.of({
          url: 'http://localhost:9999', // no server here
          category: 'noServerCat',
          _id: 'petRequest',
        }),
      };
    }

    const {sources, run} = Cycle.setup(main, {HTTP: makeHTTPDriver()});

    sources.HTTP.select().mergeAll().subscribe({
      next: function(r) {
        done('next() should not be called');
      },
      error: function(err) {
        assert.strictEqual(err.code, 'ECONNREFUSED');
        assert.strictEqual(err.port, 9999);
        done();
      },
    });

    run();
  });
});
