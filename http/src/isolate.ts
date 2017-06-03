import {Stream} from 'xstream';
import {HTTPSource, RequestOptions, RequestInput} from './interfaces';

export function isolateSource(
  httpSource: HTTPSource,
  scope: string | null,
): HTTPSource {
  if (scope === null) {
    return httpSource;
  }
  return httpSource.filter(
    (request: RequestOptions) =>
      Array.isArray(request._namespace) &&
      request._namespace.indexOf(scope) !== -1,
  );
}

export function isolateSink(
  request$: Stream<RequestInput | string>,
  scope: string | null,
): Stream<RequestInput> {
  if (scope === null) {
    return request$;
  }
  return request$.map((req: RequestInput | string) => {
    if (typeof req === 'string') {
      return {url: req, _namespace: [scope]} as RequestOptions;
    }
    req._namespace = req._namespace || [];
    req._namespace.push(scope);
    return req;
  });
}
