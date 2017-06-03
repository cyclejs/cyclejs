import xs, {Stream} from 'xstream';
import {Driver} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import jsonp = require('jsonp');

function createResponse$(url: string): ResponseStream {
  const res$: ResponseStream = xs.create<any>({
    start: listener => {
      if (typeof url !== `string`) {
        listener.error(
          new Error(
            `Observable of requests given to JSONP ` +
              `Driver must emit URL strings.`,
          ),
        );
      }

      try {
        jsonp(url, (err: Error, res: any) => {
          if (err) {
            listener.error(err);
          } else {
            listener.next(res);
            listener.complete();
          }
        });
      } catch (err) {
        listener.error(err);
      }
    },
    stop: () => {},
  }) as ResponseStream;

  res$.request = url;
  return res$;
}

export interface ResponseStream extends Stream<any> {
  request: string;
}

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
export function makeJSONPDriver(): Driver<
  Stream<string>,
  Stream<ResponseStream>
> {
  return function jsonpDriver(
    request$: Stream<string>,
  ): Stream<ResponseStream> {
    const response$$ = request$.map(createResponse$);
    return adapt(response$$);
  };
}
