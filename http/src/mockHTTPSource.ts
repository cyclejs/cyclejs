import {HTTPSource, RequestOptions, ResponseStream, Response} from './interfaces';
import xs, {Stream, MemoryStream} from 'xstream';
import {isolateSource, isolateSink} from './isolate';
import {adapt} from '@cycle/run/lib/adapt';

export type Responses = Stream<any>;

export type MockConfig = Responses | {
  [categoryName: string]: Responses | MockConfig,
};

export class MockedHttpSource implements HTTPSource {
  private _responses: Responses;

  constructor(private _mockConfig: MockConfig) {
    this._responses = adapt(xs.empty());
  }

  public filter(predicate: (request: RequestOptions) => boolean): HTTPSource {
    return new MockedHttpSource(this._responses.filter(r$ => predicate(r$.request)));
  }

  public select(categoryName?: string): any {
    return categoryName && (this._mockConfig[categoryName] || xs.empty());
  }

  public isolateSource = isolateSource;
  public isolateSink = isolateSink;
}

export function mockHTTPSource(mockConfig: MockConfig): MockedHttpSource {
  return new MockedHttpSource(mockConfig as MockConfig);
}
