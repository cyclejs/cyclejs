import {Observable} from 'rx';
import {isolateSource, isolateSink} from './isolate';
import {StreamAdapter} from '@cycle/base';
import RxAdapter from '@cycle/rx-adapter';
import {ResponseStream} from './interfaces';

export class HTTPSource {
  constructor(public response$$: Observable<any>,
              private runStreamAdapter: StreamAdapter,
              private _namespace: Array<string> = []) {
  }

  filter(predicate: (response$: ResponseStream) => boolean): HTTPSource {
    const filteredResponse$$ = this.response$$.filter(
      (res$: ResponseStream) => predicate(res$)
    );
    return new HTTPSource(filteredResponse$$, this.runStreamAdapter, this._namespace);
  }

  select(category: string): any {
    const res$$ = this.response$$.filter(
      (res$: ResponseStream) => res$.request && res$.request.category === category
    );
    return this.runStreamAdapter.adapt(res$$, RxAdapter.streamSubscribe);
  }

  public isolateSource: (source: HTTPSource, scope: string) => HTTPSource = isolateSource;
  public isolateSink: (sink: Observable<any>, scope: string) => Observable<any> = isolateSink;
}
