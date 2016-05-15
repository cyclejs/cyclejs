import {Stream} from 'xstream';
import {isolateSource, isolateSink} from './isolate';
import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import {ResponseStream} from './interfaces';

export class HTTPSource {
  constructor(private _res$$: Stream<any>,
              private runStreamAdapter: StreamAdapter,
              private _namespace: Array<string> = []) {
  }

  get response$$(): any {
    return this.runStreamAdapter.adapt(
      this._res$$,
      XStreamAdapter.streamSubscribe
    );
  }

  filter(predicate: (response$: ResponseStream) => boolean): HTTPSource {
    const filteredResponse$$ = this._res$$.filter(predicate);
    return new HTTPSource(filteredResponse$$, this.runStreamAdapter, this._namespace);
  }

  select(category: string): any {
    const res$$ = this._res$$.filter(
      (res$: ResponseStream) => res$.request && res$.request.category === category
    );
    return this.runStreamAdapter.adapt(res$$, XStreamAdapter.streamSubscribe);
  }

  public isolateSource: (source: HTTPSource, scope: string) => HTTPSource = isolateSource;
  public isolateSink: (sink: Stream<any>, scope: string) => Stream<any> = isolateSink;
}
