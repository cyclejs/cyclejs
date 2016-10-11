import {DevToolEnabledSource} from '@cycle/base';
import xsAdapter from '@cycle/xstream-adapter';
import xs from 'xstream';
import {DOMSource} from './DOMSource';
import {DOMSourceOptions} from './DOMSourceOptions';
import {EventsFnOptions} from './EventsFnOptions';
import {GenericStream} from './GenericStream';
import {VNode} from './interfaces';

export type MockConfig = {
  [name: string]: GenericStream | MockConfig;
  elements?: GenericStream;
}

export interface MockedDOMSourceOptions extends DOMSourceOptions {
  mockConfig: MockConfig;
}

const SOURCE_NAME = `MockedDOM`;
const SCOPE_PREFIX = `___`;

export class MockedDOMSource extends DOMSource {
  private _mockConfig: MockConfig;
  private _elements: any;

  constructor(options: MockedDOMSourceOptions) {
    super(options);
    this._mockConfig = options.mockConfig;
    this._elements = this._mockConfig.elements ||
      this._runStreamAdapter.adapt(xs.empty(), xsAdapter.streamSubscribe);
  }

  public elements(): any {
    const out: DevToolEnabledSource = this._elements;
    out._isCycleSource = SOURCE_NAME;

    return out;
  }

  public events(eventType: string, options: EventsFnOptions): any {
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysCount = keys.length;
    for (let idx = 0; idx < keysCount; idx++) {
      const key = keys[idx];
      if (key === eventType) {
        const out: DevToolEnabledSource = mockConfig[key];
        out._isCycleSource = SOURCE_NAME;

        return out;
      }
    }
    const out: DevToolEnabledSource = this._runStreamAdapter.adapt(
      xs.empty(),
      xsAdapter.streamSubscribe
    );
    out._isCycleSource = SOURCE_NAME;

    return out;
  }

  public select(selector: string): DOMSource {
    const options: MockedDOMSourceOptions = {
      runStreamAdapter: this._runStreamAdapter,
      driverKey: this._driverKey,
      mockConfig: {}
    };
    const mockConfig = this._mockConfig;
    const keys = Object.keys(mockConfig);
    const keysCount = keys.length;
    for (let idx = 0; idx < keysCount; idx++) {
      const key = keys[idx];
      if (key === selector) {
        options.mockConfig = mockConfig[key];

        return new MockedDOMSource(options);
      }
    }

    return new MockedDOMSource(options);
  }

  public isolateSource(source: MockedDOMSource, scope: string): DOMSource {
    return source.select(`.${SCOPE_PREFIX}${scope}`);
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

export function mockDOMSource(options: MockedDOMSourceOptions): DOMSource {
  return new MockedDOMSource(options);
}
