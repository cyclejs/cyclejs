import {ResponseStream, Response} from './lib/interfaces';
import {Stream} from 'most';
export interface HTTPSource {
  response$$: Stream<Stream<Response> & ResponseStream>;
  filter(predicate: (response$: ResponseStream & Stream<Response>) => boolean): HTTPSource;
  select(category: string): Stream<Stream<Response> & ResponseStream>;
}
