import xs, {Stream} from 'xstream';
import {StreamAdapter, DevToolEnabledSource} from '@cycle/base';
import {DOMSource, EventsFnOptions} from './DOMSource';
import xsSA from '@cycle/xstream-adapter';

export class HTMLSource implements DOMSource {
  private _html$: any;
  private _empty$: any;

  constructor(html$: Stream<string>,
              private runSA: StreamAdapter,
              private _name: string) {
    this._html$ = html$;
    this._empty$ = runSA.adapt(xs.empty(), xsSA.streamSubscribe);
  }

  public elements(): any {
    const out: DevToolEnabledSource = this.runSA.adapt(
      this._html$,
      xsSA.streamSubscribe
    );
    out._isCycleSource = this._name;
    return out;
  }

  public select(selector: string): DOMSource {
    return new HTMLSource(xs.empty(), this.runSA, this._name);
  }

  public events(eventType: string, options?: EventsFnOptions): any {
    const out: DevToolEnabledSource = this._empty$;
    out._isCycleSource = this._name;
    return out;
  }
}
