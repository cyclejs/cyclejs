import {Stream} from 'xstream';
import {Driver} from '@cycle/run';
import {requestInputToResponse$} from './http-driver';
import {MainHTTPSource} from './MainHTTPSource';
import * as superagent from 'superagent';
import * as mockSuperagent from 'superagent-mock';
import {HTTPSource, RequestInput} from './interfaces';
type MockConfig = mockSuperagent.MockConfig;

const forbidRealRequestsConfig: MockConfig = {
  pattern: '.*',
  fixtures: () => {
    throw new Error(
      'You did not provide a sufficient config to catch all requests'
    );
  },
};

export function mockHTTPDriver(
  config: Array<MockConfig>,
  logger?: any
): Driver<Stream<RequestInput>, HTTPSource> {
  function fakedHttpDriver(
    request$: Stream<RequestInput>,
    name: string = 'HTTP'
  ): HTTPSource {
    const {unset} = mockSuperagent(
      superagent,
      [...config, forbidRealRequestsConfig],
      logger
    );
    const response$$ = request$.map(requestInputToResponse$);
    const httpSource = new MainHTTPSource(response$$, name, []);
    response$$.addListener({
      next: () => {},
      error: () => {},
      complete: unset,
    });
    return httpSource;
  }
  return fakedHttpDriver;
}
