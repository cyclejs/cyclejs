import {Stream} from 'xstream';
import {Driver} from '@cycle/run';
import {requestInputToResponse$} from './http-driver';
import {MainHTTPSource} from './MainHTTPSource';
import * as superagent from 'superagent';
import * as mockSuperagent from 'superagent-mock';
import {HTTPSource, RequestInput} from './interfaces';

type MockConfig = {
  pattern: string;
  fixtures: (match: any, data: any, header: any, context: any) => any;
  callback?: (match: any, fixtures: any) => any;
};

const forbidRealRequestsConfig: MockConfig = {
  pattern: '[^\n]+',
  fixtures: () => {
    throw new Error(
      'You did not provide a sufficient config to catch all requests',
    );
  },
};

export function mockHTTPDriver(
  config: MockConfig[],
  logger?: any,
): Driver<Stream<RequestInput>, HTTPSource> {
  function httpDriver(
    request$: Stream<RequestInput>,
    name: string,
  ): HTTPSource {
    const {unset} = mockSuperagent(
      superagent,
      [...config, forbidRealRequestsConfig],
      logger,
    );
    const response$$ = request$.map(requestInputToResponse$);
    const httpSource = new MainHTTPSource(response$$, name, []);
    response$$.addListener({
      next: () => {},
      error: () => {},
      complete: () => unset(),
    });
    return httpSource;
  }
  return httpDriver;
}
