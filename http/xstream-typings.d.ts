import {ResponseStream, Response} from './lib/interfaces';
import {Stream, MemoryStream} from 'xstream';
export interface HTTPSource {
  response$$: Stream<MemoryStream<Response> & ResponseStream>;
  filter(predicate: (response$: ResponseStream & MemoryStream<Response>) => boolean): HTTPSource;
  select(category: string): Stream<MemoryStream<Response> & ResponseStream>;
}
