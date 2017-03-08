import {ResponseStream, Response, RequestOptions, RequestInput} from './lib/interfaces';
import {Stream} from 'most';
export interface HTTPSource {
  filter(predicate: (request: RequestOptions) => boolean): HTTPSource;
  select(category?: string): Stream<Stream<Response> & ResponseStream>;
  isolateSource: (source: HTTPSource, scope: string | null) => HTTPSource;
  isolateSink: (sink: Stream<RequestInput | string>, scope: string | null) => Stream<RequestInput>;
}
