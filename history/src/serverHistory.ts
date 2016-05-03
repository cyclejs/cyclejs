import {History, Listener, Location, Pathname} from './interfaces';

import {createLocation} from './util';

class ServerHistory implements History {
  private listeners: Array<Listener>;
  private _completeCallback: () => void;

  constructor() {
    this.listeners = [];
  }

  listen(listener: Listener) {
    this.listeners.push(listener);
    return function noop(): void { return void 0; };
  }

  push(location: Location | Pathname) {
    const length = this.listeners.length;
    if (length === 0) {
      throw new Error('Must be given at least one listener before pushing');
    }

    for (let i = 0; i < length; ++i) {
      this.listeners[i](createLocation(location));
    }
  }

  replace(location: Location) {
    this.push(location);
  }

  createHref(path: Pathname) {
    return path;
  }

  createLocation(location: Location | Pathname) {
    return createLocation(location);
  }

  addCompleteCallback(complete: () => void) {
    this._completeCallback = complete;
  }

  complete() {
    this._completeCallback();
  }
}

export function createServerHistory(): History {
  return new ServerHistory();
}
