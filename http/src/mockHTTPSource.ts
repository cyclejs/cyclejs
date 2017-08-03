import {
  HTTPSource,
  RequestOptions,
  ResponseStream,
  Response,
} from './interfaces';
import xs, {Stream, MemoryStream} from 'xstream';
import {isolateSource, isolateSink} from './isolate';
import {adapt} from '@cycle/run/lib/adapt';
import {
  optionsToSuperagent,
  normalizeRequestInput,
  ResponseMemoryStream,
} from './http-driver';

export type Responses = Stream<any>;

export type MockConfig =
  | Responses
  | {
      [categoryName: string]: Responses | MockConfig;
    };

export class MockedHttpSource implements HTTPSource {
  private _responses: Responses;

  constructor(private _res$$: Stream<ResponseMemoryStream>) {
    this._res$$ = _res$$;
  }

  public filter(predicate: (request: RequestOptions) => boolean): HTTPSource {
    return new MockedHttpSource(
      this._res$$.filter(response$ => predicate(response$.request)),
    );
  }

  public select(categoryName?: string): any {}

  public isolateSource = isolateSource;
  public isolateSink = isolateSink;
}

export type TranslateRequestToResponse = (
  req: RequestOptions,
) => PartialResponse;

function streamify<T>(value: T | Stream<T>): Stream<T> {
  if (value instanceof Stream) {
    return value;
  }

  return xs.of(value);
}

interface PartialResponse extends Partial<Response> {
  text: string;
}

function partialResponseToMockResponse(
  request: Request,
  partial: PartialResponse,
): Response {
  let result: Response = {
    request,

    text: partial.text,
    body: JSON.parse(partial.text), // TODO - this should act as superagent does and use the content parsers based on content type header
    files: [],
    header: {},
    type: '',
  };

  return result;
}

function requestToResponse(
  requestOptions: RequestOptions,
  f: TranslateRequestToResponse,
): ResponseMemoryStream {
  const request = optionsToSuperagent(normalizeRequestInput(requestOptions));
  const partialResponse = f(request);
  const response$ = streamify(partialResponse)
    .map(partial => partialResponseToMockResponse(request, partial))
    .remember() as ResponseMemoryStream;

  response$.request = request;

  return response$;
}

export function mockHTTPDriver(
  f: TranslateRequestToResponse,
): (sink$: Stream<RequestOptions>) => MockedHttpSource {
  return function(sink$) {
    return new MockedHttpSource(
      sink$.map(requestOptions => requestToResponse(requestOptions, f)),
    );
  };
}
