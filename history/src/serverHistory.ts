import {History, Listener, Location, Pathname} from './interfaces';

import {createLocation} from './util';

class ServerHistory implements History {
  private listeners: Array<Listener>;
  private _completeCallback: () => void;

  constructor(private currentLocation: Location | null) {
    this.listeners = [];
  }

  public listen(listener: Listener) {
    this.listeners.push(listener);
    return function noop(): void { return void 0; };
  }

  public push(location: Location | Pathname) {
    const length = this.listeners.length;
    if (length === 0) {
      throw new Error('Must be given at least one listener before pushing');
    }

    for (let i = 0; i < length; ++i) {
      this.listeners[i](createLocation(location));
    }
  }

  public replace(location: Location) {
    this.push(location);
  }

  public createHref(path: Pathname) {
    return path;
  }

  public createLocation(location: Location | Pathname): Location {
    return createLocation(location);
  }

  public getCurrentLocation(): Location | null {
    return this.currentLocation;
  }

  public addCompleteCallback(complete: () => void) {
    this._completeCallback = complete;
  }

  public complete() {
    this._completeCallback();
  }
}

export function createServerHistory(loc?: Location | Pathname): History {
  return new ServerHistory(loc ? createLocation(loc) : null);
}
