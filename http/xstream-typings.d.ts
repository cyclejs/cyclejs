import {ResponseStream, Response, RequestOptions} from './lib/interfaces';
import {Stream, MemoryStream} from 'xstream';
export interface HTTPSource {
  filter(predicate: (request: RequestOptions) => boolean): HTTPSource;
  select(category?: string): Stream<MemoryStream<Response> & ResponseStream>;
}
