import {Stream, MemoryStream} from 'xstream';
import {HTTPSource} from './interfaces';
import {isolateSource, isolateSink} from './isolate';
import {StreamAdapter, DevToolEnabledSource} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import {Response, ResponseStream, RequestOptions} from './interfaces';

export class MainHTTPSource implements HTTPSource {
  constructor(private _res$$: Stream<MemoryStream<Response> & ResponseStream>,
              private runStreamAdapter: StreamAdapter,
              private _name: string,
              private _namespace: Array<string> = []) {
  }

  filter(predicate: (request: RequestOptions) => boolean): HTTPSource {
    const filteredResponse$$ = this._res$$.filter((r$) => predicate(r$.request));
    return new MainHTTPSource(filteredResponse$$, this.runStreamAdapter, this._name, this._namespace);
  }

  select(category?: string): any {
    let res$$ = this._res$$;
    if (category) {
      res$$ = this._res$$.filter(
        res$ => res$.request && res$.request.category === category
      );
    }
    const out: DevToolEnabledSource = this.runStreamAdapter.adapt(
      res$$,
      XStreamAdapter.streamSubscribe
    );
    out._isCycleSource = this._name;
    return out;
  }

  public isolateSource: (source: HTTPSource, scope: string) => HTTPSource = isolateSource;
  public isolateSink: (sink: Stream<any>, scope: string) => Stream<any> = isolateSink;
}
