import {ResponseStream, Response, RequestOptions} from './lib/interfaces';
import {Stream} from 'most';
export interface HTTPSource {  
  filter(predicate: (request: RequestOptions) => boolean): HTTPSource;
  select(category?: string): Stream<Stream<Response> & ResponseStream>;
}
