import type { Producer } from '@cycle/callbags';
import type {
  RequestOpts,
  ResponseType,
  Progress as RawProgress,
  ResultMapping,
  Response as RawResponse,
} from '@minireq/browser';
import type { Scope } from '@cycle/run';

export type Request<
  T,
  Type extends ResponseType,
  Progress extends boolean
> = Omit<RequestOptions<T, Type, Progress>, 'method'>;

export type RequestOptions<
  T,
  Type extends ResponseType,
  Progress extends boolean = false
> = {
  progress?: Progress;
} & Omit<RequestOpts<T, Type>, 'progress' | 'onTimeout'>;

export type Response<T, Type extends ResponseType, Progress extends boolean> = {
  request: SinkRequest;
} & (
  | {
      type: 'response';
      status: number;
      data: RawResponse<ResultMapping<T>[Type]>['data'];
    }
  | (Progress extends true ? { type: 'progress'; event: RawProgress } : never)
);

export type ResponseStream = Producer<Response<any, ResponseType, boolean>> & {
  request: SinkRequest;
};

export type SinkRequest = RequestOptions<any, ResponseType, boolean> & {
  id?: number;
  namespace?: Array<Scope>;
};
