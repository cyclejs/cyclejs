import * as assert from 'assert';
import {createServer, Server} from 'http';
import {AddressInfo} from 'net';
import xs from 'xstream';
import {from, of, Observable} from 'rxjs';
import {catchError, map, mergeMap, take} from 'rxjs/operators';
import {setAdapt} from '@cycle/run/lib/adapt';
import {makeHTTPDriver, RequestInput, Response} from '../src/index';

export function runErrorRecoveryTests() {
  describe('recovering individual HTTP responses', () => {
    let server: Server;
    let uri: string;
    let requestsSeen: Array<string>;
    let onSuccessRequest: (() => void) | undefined;
    before(done => {
      server = createServer((request, response) => {
        requestsSeen.push(request.url!);
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = request.url === '/error' ? 500 : 200;
        response.end(JSON.stringify({ok: response.statusCode === 200}));
        if (request.url === '/ok' && onSuccessRequest) {
          setImmediate(onSuccessRequest);
        }
      });
      server.listen(0, '127.0.0.1', () => {
        uri = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
        done();
      });
    });
    beforeEach(() => {
      requestsSeen = [];
      onSuccessRequest = undefined;
    });
    // The containing Node suite uses the RxJS runner; restore its adapter.
    afterEach(() => setAdapt(from as any));
    after(done => server.close(done));

    it('an outer RxJS catch completes observation, not eager network activity', done => {
      setAdapt(from as any);
      const requests = xs.create<RequestInput>();
      const source = makeHTTPDriver()(requests);
      const responses = (source.select() as any) as Observable<
        Observable<Response>
      >;
      const statuses: Array<number> = [];
      let completed = false;
      onSuccessRequest = () => {
        requests.shamefullySendComplete();
        try {
          assert.strictEqual(completed, true);
          assert.deepStrictEqual(statuses, [500]);
          assert.deepStrictEqual(requestsSeen, ['/error', '/ok']);
          done();
        } catch (error) {
          done(error);
        }
      };
      responses
        .pipe(
          mergeMap(response => response.pipe(map(result => result.status))),
          catchError(error => of(error.status))
        )
        .subscribe({
          next: status => statuses.push(status),
          error: done,
          complete: () => {
            completed = true;
            requests.shamefullySendNext(uri + '/ok');
          },
        });
      requests.shamefullySendNext(uri + '/error');
    });

    it('xstream inner replaceError allows a later successful request', done => {
      setAdapt(stream => stream);
      const requests = xs.create<RequestInput>();
      const source = makeHTTPDriver()(requests);
      const statuses: Array<number> = [];
      source
        .select()
        .map(response =>
          response
            .map(result => result.status)
            .replaceError(error => xs.of(error.status))
        )
        .flatten()
        .take(2)
        .addListener({
          next: status => {
            statuses.push(status);
            if (statuses.length === 1) {
              requests.shamefullySendNext(uri + '/ok');
            }
          },
          error: done,
          complete: () => {
            requests.shamefullySendComplete();
            try {
              assert.deepStrictEqual(statuses, [500, 200]);
              assert.deepStrictEqual(requestsSeen, ['/error', '/ok']);
              done();
            } catch (error) {
              done(error);
            }
          },
        });
      requests.shamefullySendNext(uri + '/error');
    });

    it('RxJS inner catchError allows a later successful request', done => {
      setAdapt(from as any);
      const requests = xs.create<RequestInput>();
      const source = makeHTTPDriver()(requests);
      const responses = (source.select() as any) as Observable<
        Observable<Response>
      >;
      const statuses: Array<number> = [];
      responses
        .pipe(
          mergeMap(response =>
            response.pipe(
              map(result => result.status),
              catchError(error => of(error.status))
            )
          ),
          take(2)
        )
        .subscribe({
          next: status => {
            statuses.push(status);
            if (statuses.length === 1) {
              requests.shamefullySendNext(uri + '/ok');
            }
          },
          error: done,
          complete: () => {
            requests.shamefullySendComplete();
            try {
              assert.deepStrictEqual(statuses, [500, 200]);
              assert.deepStrictEqual(requestsSeen, ['/error', '/ok']);
              done();
            } catch (error) {
              done(error);
            }
          },
        });
      requests.shamefullySendNext(uri + '/error');
    });
  });
}
