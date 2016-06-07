import {StreamAdapter} from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import xs, {Stream} from 'xstream';

export interface DOMSelection {
  elements: Stream<any>;
  events: (eventType: string) => Stream<any>;
}

export class MockedDOMSource {
  public elements: any;

  constructor(private _streamAdapter: StreamAdapter,
              private _mockConfig: Object) {
    if (_mockConfig['elements']) {
      this.elements = _mockConfig['elements'];
    } else {
      this.elements = _streamAdapter.adapt(
        xs.empty(),
        XStreamAdapter.streamSubscribe
      );
    }
  }

  public events(eventType: string) {
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === eventType) {
        return mockConfig[key];
      }
    }
    return this._streamAdapter.adapt(xs.empty(), XStreamAdapter.streamSubscribe);
  }

  public select(selector: string): DOMSelection {
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

export function mockDOMSource(streamAdapter: StreamAdapter,
                              mockConfig: Object): MockedDOMSource {
  return new MockedDOMSource(streamAdapter, mockConfig);
}
