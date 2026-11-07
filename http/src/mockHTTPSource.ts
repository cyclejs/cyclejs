import xs, {Stream, MemoryStream} from 'xstream';
import {FantasyObservable} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {MainHTTPSource} from './MainHTTPSource';
import {
  HTTPSource,
  RequestOptions,
  Response,
  ResponseStream,
} from './interfaces';

export type MockHTTPResponseStream = FantasyObservable<any> & {
  request?: RequestOptions;
};

export type MockHTTPConfig = {
  [category: string]: FantasyObservable<MockHTTPResponseStream>;
};

/** Make an HTTP source from category-keyed streams of response streams. */
export function mockHTTPSource(config: MockHTTPConfig): HTTPSource {
  const categories = Object.keys(config).map(category =>
    xs
      .fromObservable<MockHTTPResponseStream>(config[category])
      .map(response$ => {
        const request = {url: '', ...response$.request, category};
        // A fresh wrapper avoids mutating an input MemoryStream or Observable.
        const wrapped = xs
          .fromObservable<Response>(response$)
          .map((value: Response) => value)
          .remember();
        const output = adapt(wrapped) as MemoryStream<Response> &
          ResponseStream;
        Object.defineProperty(output, 'request', {
          value: request,
          writable: false,
        });
        return output;
      })
  );
  const responses: Stream<
    MemoryStream<Response> & ResponseStream
  > = categories.length ? xs.merge(...categories) : xs.empty();
  return new MainHTTPSource(responses, 'MockedHTTP');
}
