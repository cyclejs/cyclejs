import { Source } from '@cycle/callbags';
import { RequestOpts, RequestOptions, ResponseType, Result } from 'minireq';

export type Request<T, Type extends ResponseType> = Omit<
  RequestOpts<T, Type>,
  'method'
>;
export type ResponseStream = Source<Result<any>> & { id: number };

export type SinkRequest = RequestOptions & {
  id: number;
};
