import {Observable} from 'rx';

export interface DOMSelection {
  observable: Observable<any>;
  events: (eventType: string) => Observable<any>;
}

export class MockedDOMSelection {
  public observable: Observable<any>;

  constructor(private mockConfigEventTypes: Object,
              mockConfigObservable?: Observable<any>) {
    if (mockConfigObservable) {
      this.observable = mockConfigObservable;
    } else {
      this.observable = Observable.empty();
    }
  }

  public events(eventType: string) {
    const mockConfigEventTypes = this.mockConfigEventTypes;
    const keys = Object.keys(mockConfigEventTypes);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === eventType) {
        return mockConfigEventTypes[key];
      }
    }
    return Observable.empty();
  }
}

export class MockedDOMSource {
  constructor(private mockConfig: Object) {
  }

  public select(selector: string): DOMSelection {
    const mockConfig = this.mockConfig;
    const keys = Object.keys(mockConfig);
    const keysLen = keys.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys[i];
      if (key === selector) {
        return new MockedDOMSelection(mockConfig[key], mockConfig['observable']);
      }
    }
    return new MockedDOMSelection({}, mockConfig['observable']);
  }
}

export function mockDOMSource(mockConfig: Object): MockedDOMSource {
  return new MockedDOMSource(mockConfig);
}
