import {StreamAdapter} from '@cycle/base';
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
    return this._elements;
  }

  public events(eventType: string, options: EventsFnOptions): any {
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === eventType) {
        return mockConfig[key];
      }
    }
    return this._streamAdapter.adapt(xs.empty(), xsSA.streamSubscribe);
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
}

export function mockDOMSource(
    streamAdapter: StreamAdapter,
    mockConfig: Object): DOMSource {
  return new MockedDOMSource(streamAdapter, mockConfig);
}
