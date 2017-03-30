import {HTTPSource, RequestOptions, ResponseStream, RequestInput, Response} from './interfaces';
import {Stream, MemoryStream} from 'xstream';
import {FantasyObservable} from '@cycle/run';
import {isolateSource, isolateSink} from './isolate';

export type MockConfig = {
  [name: string]: FantasyObservable | MockConfig;
};

export class MockedHttpSource implements HTTPSource {
  constructor(private _mockConfig: MockConfig) {
    return;
  }

  public filter<S extends HTTPSource>(predicate: (request: RequestOptions) => boolean): S {
    throw new Error('Not implemented');
  }

  public select(selector?: string): Stream<MemoryStream<Response> & ResponseStream> {
    throw new Error('Not implemented');
  }

  public isolateSource = isolateSource;
  public isolateSink = isolateSink;
}

export function mockHTTPSource(mockConfig: MockConfig): MockedHttpSource {
  return new MockedHttpSource(mockConfig as MockConfig);
}
