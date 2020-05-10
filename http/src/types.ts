import { Producer } from '@cycle/callbags';
import {
  RequestOpts,
  RequestOptions,
  ResponseType,
  Response
} from '@minireq/browser';

export type Request<T, Type extends ResponseType> = Omit<
  RequestOpts<T, Type>,
  'method'
>;
export type ResponseStream = Producer<Response<any>> & { request: SinkRequest };

export type SinkRequest = RequestOptions & {
  id: number;
};
