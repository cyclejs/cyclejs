import { makeRequest, RequestFn } from '@minireq/browser';
import type { Plugin } from '@cycle/run';

import { HttpDriver } from './driver';
import { makeHttpApi } from './api';
import type { ResponseStream, SinkRequest } from './types';

export { HttpApi } from './api';

export function makeHttpPlugin(
  request: RequestFn = makeRequest()
): Plugin<ResponseStream, SinkRequest> {
  return [new HttpDriver(request), makeHttpApi];
}
