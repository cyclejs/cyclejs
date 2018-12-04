import xs, {Stream, MemoryStream} from 'xstream';
import {Driver} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {MainHTTPSource} from './MainHTTPSource';
import * as superagent from 'superagent';
import {
  HTTPSource,
  ResponseStream,
  RequestOptions,
  RequestInput,
  Response,
} from './interfaces';

function preprocessReqOptions(reqOptions: RequestOptions): RequestOptions {
  reqOptions.withCredentials = reqOptions.withCredentials || false;
  reqOptions.redirects =
    typeof reqOptions.redirects === 'number' ? reqOptions.redirects : 5;
  reqOptions.method = reqOptions.method || `get`;
  return reqOptions;
}

export function optionsToSuperagent(rawReqOptions: RequestOptions) {
  const reqOptions = preprocessReqOptions(rawReqOptions);
  if (typeof reqOptions.url !== `string`) {
    throw new Error(
      `Please provide a \`url\` property in the request options.`
    );
  }
  const lowerCaseMethod = (reqOptions.method || 'GET').toLowerCase();
  const sanitizedMethod =
    lowerCaseMethod === `delete` ? `del` : lowerCaseMethod;

  let request = superagent[sanitizedMethod](reqOptions.url);
  if (typeof request.redirects === `function`) {
    request = request.redirects(reqOptions.redirects);
  }
  if (reqOptions.type) {
    request = request.type(reqOptions.type);
  }
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
  if (reqOptions.agent) {
    request = request.key(reqOptions.agent.key);
    request = request.cert(reqOptions.agent.cert);
  }
  if (
    typeof reqOptions.user === 'string' &&
    typeof reqOptions.password === 'string'
  ) {
    request = request.auth(reqOptions.user, reqOptions.password);
  }
  if (reqOptions.headers) {
    for (const key in reqOptions.headers) {
      if (reqOptions.headers.hasOwnProperty(key)) {
        request = request.set(key, reqOptions.headers[key]);
      }
    }
  }
  if (reqOptions.field) {
    for (const key in reqOptions.field) {
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
  if (reqOptions.responseType) {
    request = request.responseType(reqOptions.responseType);
  }
  if (reqOptions.ok) {
    request = request.ok(reqOptions.ok);
  }
  return request;
}

export function createResponse$(reqInput: RequestInput): Stream<Response> {
  let request: any;
  return xs.create<Response>({
    start: function startResponseStream(listener) {
      try {
        const reqOptions = normalizeRequestInput(reqInput);
        request = optionsToSuperagent(reqOptions);
        if (reqOptions.progress) {
          request = request.on('progress', (res: Response) => {
            res.request = reqOptions;
            listener.next(res);
          });
        }
        request.end((err: any, res: Response) => {
          if (err) {
            if (err.response) {
              err.response.request = reqOptions;
            }
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
      if (request && request.abort) {
        request.abort();
        request = null;
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

function normalizeRequestInput(reqInput: RequestInput): RequestOptions {
  if (typeof reqInput === 'string') {
    return {url: reqInput};
  } else if (typeof reqInput === 'object') {
    return reqInput;
  } else {
    throw new Error(
      `Observable of requests given to HTTP Driver must emit ` +
        `either URL strings or objects with parameters.`
    );
  }
}

export type ResponseMemoryStream = MemoryStream<Response> & ResponseStream;

function requestInputToResponse$(reqInput: RequestInput): ResponseMemoryStream {
  let response$ = createResponse$(reqInput).remember();
  const reqOptions = softNormalizeRequestInput(reqInput);
  if (!reqOptions.lazy) {
    response$.addListener({
      next: () => {},
      error: () => {},
      complete: () => {},
    });
  }
  response$ = adapt(response$);
  Object.defineProperty(response$, 'request', {
    value: reqOptions,
    writable: false,
  });
  return response$ as ResponseMemoryStream;
}

export function makeHTTPDriver(): Driver<Stream<RequestInput>, HTTPSource> {
  function httpDriver(
    request$: Stream<RequestInput>,
    name: string = 'HTTP'
  ): HTTPSource {
    const response$$ = request$.map(requestInputToResponse$);
    const httpSource = new MainHTTPSource(response$$, name, []);
    response$$.addListener({
      next: () => {},
      error: () => {},
      complete: () => {},
    });
    return httpSource;
  }
  return httpDriver;
}
