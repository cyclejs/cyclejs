import { makeRequest, RequestFn } from '@minireq/browser';
import { Plugin } from '@cycle/run';

import { HttpDriver } from './driver';
import { makeHttpApi } from './api';
import { ResponseStream, SinkRequest } from './types';

export { HttpApi } from './api';

const defaultHandler = (err: any) => {
  throw err;
};

export function makeHttpPlugin(
  request: RequestFn = makeRequest(),
  errorHandler: (err: any) => void = defaultHandler
): Plugin<ResponseStream, SinkRequest> {
  return [new HttpDriver(request, errorHandler), makeHttpApi];
}
