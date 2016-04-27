import {History, Listener, Location, Pathname} from './interfaces';

import {createLocation} from './util';

function noop(): void {
  return void 0;
}

class ServerHistory implements History {
  private listeners: Array<Listener>;
  constructor() {
    this.listeners = [];
  }

  listen(listener: Listener) {
    this.listeners.push(listener);
    return noop;
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
}

export function createServerHistory(): History {
  return new ServerHistory();
}