import {StreamAdapter, DevToolEnabledSource} from '@cycle/base';
import {VNode} from './interfaces';
import xsSA from '@cycle/xstream-adapter';
import {DOMSource, EventsFnOptions} from './DOMSource';
import xs from 'xstream';

export type GenericStream = any;
export type ElementStream = any;
export type EventStream = any;

export type MockConfig = {
  [name: string]: GenericStream | MockConfig;
  elements?: GenericStream;
}

const SCOPE_PREFIX = '___';

export class MockedDOMSource implements DOMSource {
  private _elements: any;

  constructor(private _streamAdapter: StreamAdapter,
              private _mockConfig: MockConfig) {
    if (_mockConfig.elements) {
      this._elements = _mockConfig.elements;
    } else {
      this._elements = _streamAdapter.adapt(xs.empty(), xsSA.streamSubscribe);
    }
  }

  public elements(): any {
    const out: DevToolEnabledSource = this._elements;
    out._isCycleSource = 'MockedDOM';
    return out;
  }

  public events(eventType: string, options: EventsFnOptions): any {
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === eventType) {
        const out: DevToolEnabledSource = mockConfig[key];
        out._isCycleSource = 'MockedDOM';
        return out;
      }
    }
    const out: DevToolEnabledSource = this._streamAdapter.adapt(
      xs.empty(),
      xsSA.streamSubscribe
    );
    out._isCycleSource = 'MockedDOM';
    return out;
  }

  public select(selector: string): DOMSource {
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === selector) {
        return new MockedDOMSource(this._streamAdapter, mockConfig[key]);
      }
    }
    return new MockedDOMSource(this._streamAdapter, {});
  }

  public isolateSource(source: MockedDOMSource, scope: string): DOMSource {
    return source.select('.' + SCOPE_PREFIX + scope);
  }

  public isolateSink(sink: any, scope: string): any {
    return sink.map((vnode: VNode) => {
      if (vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
        return vnode;
      } else {
        vnode.sel += `.${SCOPE_PREFIX}${scope}`;
        return vnode;
      }
    });
  }
}

export function mockDOMSource(
    streamAdapter: StreamAdapter,
    mockConfig: Object): DOMSource {
  return new MockedDOMSource(streamAdapter, mockConfig);
}
