import xs, {Stream} from 'xstream';

export interface DOMSelection {
  elements: Stream<any>;
  events: (eventType: string) => Stream<any>;
}

export class MockedDOMSource {
  public elements: Stream<any>;

  constructor(private _mockConfig: Object) {
    if (_mockConfig['elements']) {
      this.elements = _mockConfig['elements'];
    } else {
      this.elements = xs.empty();
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
    return xs.empty();
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
