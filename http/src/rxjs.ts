import {
  ResponseStream,
  Response,
  RequestOptions,
  RequestInput,
  makeHTTPDriver as make,
  mockHTTPSource as mock,
  MockHTTPConfig,
} from './index';
import {Observable} from 'rxjs';
import {Stream} from 'xstream';
import {Driver, FantasyObservable} from '@cycle/run';

export interface HTTPSource {
  filter(predicate: (request: RequestOptions) => boolean): HTTPSource;
  select(category?: string): Observable<Observable<Response> & ResponseStream>;
  isolateSource(source: HTTPSource, scope: string | null): HTTPSource;
  isolateSink(
    sink: Observable<RequestInput | string>,
    scope: string | null
  ): Observable<RequestInput>;
}

export const makeHTTPDriver: () => Driver<
  Stream<RequestInput>,
  HTTPSource
> = make as any;

export const mockHTTPSource: (
  mockConfig?: MockHTTPConfig | FantasyObservable<any>,
  name?: string
) => HTTPSource = mock as any;
