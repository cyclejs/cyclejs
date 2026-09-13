import xs, {Stream, MemoryStream} from 'xstream';
import {MainHTTPSource} from './MainHTTPSource';
import {Response, ResponseStream} from './interfaces';

export type MockHTTPConfig = {
  [category: string]: Stream<Stream<Response>>;
};

/**
 * A factory for an HTTPSource mock, comparable to `mockDOMSource`.
 *
 * Takes a config object mapping request categories to metastreams of
 * responses. Selecting a category yields its configured responses, with a
 * matching `request` object attached, so `filter()` keeps working as it
 * does with the real HTTP driver.
 *
 * @param {Object} mockConfig an object mapping categories to metastreams
 * @return {HTTPSource} a mock HTTP source
 * @function mockHTTPSource
 */
export function mockHTTPSource(mockConfig: MockHTTPConfig): MainHTTPSource {
  const categories = Object.keys(mockConfig);
  const res$$: Stream<MemoryStream<Response> & ResponseStream> =
    categories.length === 0
      ? xs.empty()
      : xs.merge(
          ...categories.map(category =>
            mockConfig[category].map(res$ => {
              const out = res$ as MemoryStream<Response> & ResponseStream;
              out.request = {url: '', category};
              return out;
            })
          )
        );
  return new MainHTTPSource(res$$, 'HTTP');
}
