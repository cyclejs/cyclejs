import {Location, Pathname} from './interfaces';
import objectAssign = require('object-assign');

export function supportsHistory(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;

  if ((ua.indexOf('Android 2.') !== -1 ||
      ua.indexOf('Android 4.0') !== -1) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1 &&
      ua.indexOf('Windows Phone') === -1) {
    return false;
  }

  if (typeof window !== 'undefined') {
    return window.history && 'pushState' in window.history;
  } else {
    return false;
  }
}

const locationDefaults: Location = {
  pathname: '/',
  action: 'POP',
  hash: '',
  search: '',
};

export function createLocation(location: Location | Pathname | undefined): Location {
  if (typeof location === 'string') {
    return objectAssign({}, locationDefaults, {pathname: location});
  } else if (typeof location === 'object') {
    return objectAssign({}, locationDefaults, location);
  } else {
    return locationDefaults;
  }
}
