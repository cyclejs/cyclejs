import xs, {Stream, MemoryStream} from 'xstream';
import {DevToolEnabledSource, FantasyObservable} from '@cycle/run';
import {VNode} from './interfaces';
import {DOMSource, EventsFnOptions} from './DOMSource';
import {adapt} from '@cycle/run/lib/adapt';

export type MockConfig = {
  [name: string]: FantasyObservable | MockConfig;
};

const SCOPE_PREFIX = '___';

export class MockedDOMSource implements DOMSource {
  private _elements: FantasyObservable;

  constructor(private _mockConfig: MockConfig) {
    if (_mockConfig['elements']) {
      this._elements = _mockConfig['elements'] as FantasyObservable;
    } else {
      this._elements = adapt(xs.empty());
    }
  }

  public elements(): any {
    const out: Partial<DevToolEnabledSource> & FantasyObservable = this._elements;
    out._isCycleSource = 'MockedDOM';
    return out;
  }

  public events(eventType: string, options?: EventsFnOptions): any {
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === eventType) {
        const out: DevToolEnabledSource & FantasyObservable = adapt(mockConfig[key] as any);
        out._isCycleSource = 'MockedDOM';
        return out;
      }
    }
    const out: DevToolEnabledSource & FantasyObservable = adapt(xs.empty());
    out._isCycleSource = 'MockedDOM';
    return out;
  }

  public select(selector: string): MockedDOMSource {
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === selector) {
        return new MockedDOMSource(mockConfig[key] as MockConfig);
      }
    }
    return new MockedDOMSource({} as MockConfig);
  }

  public isolateSource(source: MockedDOMSource, scope: string): MockedDOMSource {
    return source.select('.' + SCOPE_PREFIX + scope);
  }

  public isolateSink(sink: any, scope: string): any {
    return sink.map((vnode: VNode) => {
      if (vnode.sel && vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
        return vnode;
      } else {
        vnode.sel += `.${SCOPE_PREFIX}${scope}`;
        return vnode;
      }
    });
  }
}

export function mockDOMSource(mockConfig: MockConfig): MockedDOMSource {
  return new MockedDOMSource(mockConfig as MockConfig);
}
