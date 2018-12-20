import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {HTTPSource, RequestOptions, RequestInput} from './interfaces';

function arrayEqual(
  requestNamespace: Array<any>,
  sourceNamespace: Array<any>
): boolean {
  for (let i = 0; i < sourceNamespace.length; i++) {
    if (requestNamespace[i] !== sourceNamespace[i]) {
      return false;
    }
  }
  return true;
}

export function isolateSource(
  httpSource: HTTPSource,
  scope: string | null
): HTTPSource {
  if (scope === null) {
    return httpSource;
  }
  return httpSource.filter(
    (request: RequestOptions) =>
      Array.isArray(request._namespace) &&
      arrayEqual(
        request._namespace,
        (httpSource as any)._namespace.concat(scope)
      ),
    scope
  );
}

export function isolateSink(
  request$: Stream<RequestInput | string>,
  scope: string | null
): Stream<RequestInput> {
  if (scope === null) {
    return request$;
  }
  return adapt(
    xs.fromObservable<RequestInput | string>(request$).map(req => {
      if (typeof req === 'string') {
        return {url: req, _namespace: [scope]} as RequestOptions;
      }
      req._namespace = req._namespace || [];
      req._namespace.unshift(scope);
      return req;
    })
  );
}
