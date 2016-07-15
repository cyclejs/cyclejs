import {ResponseStream, Response} from './lib/interfaces';
import {Observable} from 'rxjs';
export interface HTTPSource {
  response$$: Observable<Observable<Response> & ResponseStream>;
  filter(predicate: (response$: ResponseStream & Observable<Response>) => boolean): HTTPSource;
  select(category: string): Observable<Observable<Response> & ResponseStream>;
}
