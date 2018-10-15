import {
  ResponseStream,
  Response,
  RequestOptions,
  RequestInput,
  makeHTTPDriver as make,
} from './index';
import {Stream} from 'most';
import xs from 'xstream';
import {Driver} from '@cycle/run';
export interface HTTPSource {
  filter(predicate: (request: RequestOptions) => boolean): HTTPSource;
  select(category?: string): Stream<Stream<Response> & ResponseStream>;
  isolateSource(source: HTTPSource, scope: string | null): HTTPSource;
  isolateSink(
    sink: Stream<RequestInput | string>,
    scope: string | null
  ): Stream<RequestInput>;
}

export const makeHTTPDriver: () => Driver<
  xs<RequestInput>,
  HTTPSource
> = make as any;
