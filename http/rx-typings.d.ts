import {ResponseStream, Response, RequestOptions} from './lib/interfaces';
import {Observable} from 'rx';
export interface HTTPSource {  
  filter(predicate: (request: RequestOptions) => boolean): HTTPSource;
  select(category?: string): Observable<Observable<Response> & ResponseStream>;
}
