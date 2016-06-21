import xs, {Stream, MemoryStream} from 'xstream';
import {MainHTTPSource} from './MainHTTPSource';
import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import * as superagent from 'superagent';
import {
  HTTPSource,
  ResponseStream,
  RequestOptions,
  RequestInput,
  Response
} from './interfaces';

function preprocessReqOptions(reqOptions: RequestOptions): RequestOptions {
  reqOptions.withCredentials = reqOptions.withCredentials || false;
  reqOptions.redirects = typeof reqOptions.redirects === 'number' ? reqOptions.redirects : 5;
  reqOptions.type = reqOptions.type || `json`;
  reqOptions.method = reqOptions.method || `get`;
  return reqOptions;
}

export function optionsToSuperagent(rawReqOptions: RequestOptions) {
  const reqOptions = preprocessReqOptions(rawReqOptions);
  if (typeof reqOptions.url !== `string`) {
    throw new Error(`Please provide a \`url\` property in the request options.`);
  }
  const lowerCaseMethod = reqOptions.method.toLowerCase();
  const sanitizedMethod = lowerCaseMethod === `delete` ? `del` : lowerCaseMethod;

  let request = superagent[sanitizedMethod](reqOptions.url);
  if (typeof request.redirects === `function`) {
    request = request.redirects(reqOptions.redirects);
  }
  request = request.type(reqOptions.type);
  if (reqOptions.send) {
    request = request.send(reqOptions.send);
  }
  if (reqOptions.accept) {
    request = request.accept(reqOptions.accept);
  }
  if (reqOptions.query) {
    request = request.query(reqOptions.query);
  }
  if (reqOptions.withCredentials) {
    request = request.withCredentials();
  }
  if (typeof reqOptions.user === 'string' && typeof reqOptions.password === 'string') {
    request = request.auth(reqOptions.user, reqOptions.password);
  }
  if (reqOptions.headers) {
    for (let key in reqOptions.headers) {
      if (reqOptions.headers.hasOwnProperty(key)) {
        request = request.set(key, reqOptions.headers[key]);
      }
    }
  }
  if (reqOptions.field) {
    for (let key in reqOptions.field) {
      if (reqOptions.field.hasOwnProperty(key)) {
        request = request.field(key, reqOptions.field[key]);
      }
    }
  }
  if (reqOptions.attach) {
    for (let i = reqOptions.attach.length - 1; i >= 0; i--) {
      const a = reqOptions.attach[i];
      request = request.attach(a.name, a.path, a.filename);
    }
  }
  return request;
}

export function createResponse$(reqInput: RequestInput): Stream<Response> {
  return xs.create<Response>({
    start: function startResponseStream(listener) {
      try {
        const reqOptions = normalizeRequestInput(reqInput);
        this.request = optionsToSuperagent(reqOptions);
        if (reqOptions.progress) {
          this.request = this.request.on('progress', (res: Response) => {
            res.request = reqOptions;
            listener.next(res);
          });
        }
        this.request.end((err: any, res: Response) => {
          if (err) {
            listener.error(err);
          } else {
            res.request = reqOptions;
            listener.next(res);
            listener.complete();
          }
        });
      } catch (err) {
        listener.error(err);
      }
    },
    stop: function stopResponseStream() {
      if (this.request && this.request.abort) {
        this.request.abort();
      }
    },
  });
}

function softNormalizeRequestInput(reqInput: RequestInput): RequestOptions {
  let reqOptions: RequestOptions;
  try {
    reqOptions = normalizeRequestInput(reqInput);
  } catch (err) {
    reqOptions = {url: 'Error', _error: err};
  }
  return reqOptions;
}

function normalizeRequestInput(reqOptions: RequestInput): RequestOptions {
  if (typeof reqOptions === 'string') {
    return {url: <string> reqOptions};
  } else if (typeof reqOptions === 'object') {
    return <RequestOptions> reqOptions;
  } else {
    throw new Error(`Observable of requests given to HTTP Driver must emit ` +
      `either URL strings or objects with parameters.`);
  }
}

function makeRequestInputToResponse$(runStreamAdapter: StreamAdapter) {
  return function requestInputToResponse$(reqInput: RequestInput): MemoryStream<Response> & ResponseStream {
    let response$ = createResponse$(reqInput).remember();
    /* tslint:disable:no-empty */
    response$.addListener({next: () => {}, error: () => {}, complete: () => {}});
    /* tslint:enable:no-empty */
    response$ = (runStreamAdapter) ?
      runStreamAdapter.adapt(response$, XStreamAdapter.streamSubscribe) :
      response$;
    Object.defineProperty(response$, 'request', <PropertyDescriptor> {
      value: softNormalizeRequestInput(reqInput),
      writable: false,
    });
    return <MemoryStream<Response> & ResponseStream> response$;
  };
}

export function makeHTTPDriver(): Function {
  function httpDriver(request$: Stream<RequestInput>, runSA: StreamAdapter): HTTPSource {
    let response$$ = request$
      .map(makeRequestInputToResponse$(runSA))
      .remember();
    let httpSource = new MainHTTPSource(response$$, runSA, []);
    /* tslint:disable:no-empty */
    response$$.addListener({next: () => {}, error: () => {}, complete: () => {}});
    /* tslint:enable:no-empty */
    return httpSource;
  }
  (<any> httpDriver).streamAdapter = XStreamAdapter;
  return httpDriver;
}
