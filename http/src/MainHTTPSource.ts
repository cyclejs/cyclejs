import {Stream, MemoryStream} from 'xstream';
import {HTTPSource} from './interfaces';
import {isolateSource, isolateSink} from './isolate';
import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import {Response, ResponseStream} from './interfaces';

export class MainHTTPSource implements HTTPSource {
  constructor(private _res$$: Stream<MemoryStream<Response> & ResponseStream>,
              private runStreamAdapter: StreamAdapter,
              private _namespace: Array<string> = []) {
  }

  get response$$(): any {
    return this.runStreamAdapter.adapt(
      this._res$$,
      XStreamAdapter.streamSubscribe
    );
  }

  filter(predicate: (response$: ResponseStream & MemoryStream<Response>) => boolean): HTTPSource {
    const filteredResponse$$ = this._res$$.filter(predicate);
    return new MainHTTPSource(filteredResponse$$, this.runStreamAdapter, this._namespace);
  }

  select(category?: string): any {
    let res$$ = this._res$$;
    if (category) {
      res$$ = this._res$$.filter(
        res$ => res$.request && res$.request.category === category
      );
    }
    return this.runStreamAdapter.adapt(res$$, XStreamAdapter.streamSubscribe);
  }

  public isolateSource: (source: HTTPSource, scope: string) => HTTPSource = isolateSource;
  public isolateSink: (sink: Stream<any>, scope: string) => Stream<any> = isolateSink;
}
