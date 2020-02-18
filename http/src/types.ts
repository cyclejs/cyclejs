import { Source } from '@cycle/callbags';
import { RequestOptions, Result } from 'minireq';

export type Request = Omit<RequestOptions, 'method'>;
export type ResponseStream = Source<Result<any>> & { id: number };

export type SinkRequest = RequestOptions & {
  id: number;
};
