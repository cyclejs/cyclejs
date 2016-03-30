import {Observable} from 'rx';

export interface DOMSelection {
  observable: Observable<any>;
  events: (eventType: string) => Observable<any>;
}

export class MockedDOMSource {
  public observable: Observable<any>;

  constructor(private _mockConfig: Object) {
    if (_mockConfig['observable']) {
      this.observable = _mockConfig['observable'];
    } else {
      this.observable = Observable.empty();
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
    return Observable.empty();
  }

  public select(selector: string): DOMSelection {
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === selector) {
        return new MockedDOMSource(mockConfig[key]);
      }
    }
    return new MockedDOMSource({});
  }
}

export function mockDOMSource(mockConfig: Object): MockedDOMSource {
  return new MockedDOMSource(mockConfig);
}
