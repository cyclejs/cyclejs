import { makeRequest, RequestFn } from 'minireq';

import { HttpDriver } from './driver';
import { makeHttpApi } from './api';

export function makeHttpPlugin(request: RequestFn = makeRequest()) {
  return [new HttpDriver(request), makeHttpApi];
}
