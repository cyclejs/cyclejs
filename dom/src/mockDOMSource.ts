import xs, {Stream, MemoryStream} from 'xstream';
import {DevToolEnabledSource, FantasyObservable} from '@cycle/run';
import {VNode} from 'snabbdom/vnode';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {adapt} from '@cycle/run/lib/adapt';

export type MockConfig = {
  [name: string]: FantasyObservable<any> | MockConfig;
};

const SCOPE_PREFIX = '___';

export class MockedDOMSource {
  private _elements: FantasyObservable<any>;

  constructor(private _mockConfig: MockConfig) {
    if (_mockConfig.elements) {
      this._elements = _mockConfig.elements as FantasyObservable<any>;
    } else {
      this._elements = adapt(xs.empty());
    }
  }

  public elements(): any {
    const out: Partial<DevToolEnabledSource> & FantasyObservable<any> = this
      ._elements;
    out._isCycleSource = 'MockedDOM';
    return out;
  }

  public element(): any {
    const output$: MemoryStream<Element> = this.elements()
      .filter((arr: Array<any>) => arr.length > 0)
      .map((arr: Array<any>) => arr[0])
      .remember();
    const out: DevToolEnabledSource & MemoryStream<Element> = adapt(output$);
    out._isCycleSource = 'MockedDOM';
    return out;
  }

  public events(
    eventType: string,
    options?: EventsFnOptions,
    bubbles?: boolean
  ): any {
    const streamForEventType = this._mockConfig[eventType] as any;
    const out: DevToolEnabledSource & FantasyObservable<any> = adapt(
      streamForEventType || xs.empty()
    );

    out._isCycleSource = 'MockedDOM';

    return out;
  }

  public select(selector: string): MockedDOMSource {
    const mockConfigForSelector = this._mockConfig[selector] || {};

    return new MockedDOMSource(mockConfigForSelector as MockConfig);
  }

  public isolateSource(
    source: MockedDOMSource,
    scope: string
  ): MockedDOMSource {
    return source.select('.' + SCOPE_PREFIX + scope);
  }

  public isolateSink(sink: any, scope: string): any {
    return adapt(
      xs.fromObservable<any>(sink).map((vnode: VNode) => {
        if (vnode.sel && vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
          return vnode;
        } else {
          vnode.sel += `.${SCOPE_PREFIX}${scope}`;
          return vnode;
        }
      })
    );
  }
}

export function mockDOMSource(mockConfig: MockConfig): MockedDOMSource {
  return new MockedDOMSource(mockConfig);
}
