import {Stream, MemoryStream} from 'xstream';
import {HTTPSource} from './interfaces';
import {isolateSource, isolateSink} from './isolate';
import {DevToolEnabledSource} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {Response, ResponseStream, RequestOptions} from './interfaces';

export class MainHTTPSource implements HTTPSource {
  constructor(
    private _res$$: Stream<MemoryStream<Response> & ResponseStream>,
    private _name: string,
    private _namespace: Array<string> = []
  ) {}

  public filter(
    predicate: (request: RequestOptions) => boolean,
    scope?: string
  ): HTTPSource {
    const filteredResponse$$ = this._res$$.filter(r$ => predicate(r$.request));
    return new MainHTTPSource(
      filteredResponse$$,
      this._name,
      scope === undefined ? this._namespace : this._namespace.concat(scope)
    );
  }

  public select(category?: string): any {
    const res$$ = category
      ? this._res$$.filter(
          res$ => res$.request && res$.request.category === category
        )
      : this._res$$;
    const out: DevToolEnabledSource = adapt(res$$);
    out._isCycleSource = this._name;
    return out;
  }

  public isolateSource = isolateSource;
  public isolateSink = isolateSink;
}
