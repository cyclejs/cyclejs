import {ResponseStream, Response, RequestOptions, RequestInput} from './lib/interfaces';
import {Stream} from 'most';
export interface HTTPSource {
  filter(predicate: (request: RequestOptions) => boolean): HTTPSource;
  select(category?: string): Stream<Stream<Response> & ResponseStream>;
  isolateSource: (source: HTTPSource, scope: string) => HTTPSource;
  isolateSink: (sink: Stream<RequestInput>, scope: string) => Stream<RequestInput>;
}
