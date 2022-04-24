import { makeRequest, RequestFn } from '@minireq/browser';

import { HttpDriver } from './driver';
import { makeHttpApi } from './api';

export { HttpApi } from './api';

export function makeHttpPlugin(
  request: RequestFn = makeRequest()
): [HttpDriver, typeof makeHttpApi] {
  return [new HttpDriver(request), makeHttpApi];
}
