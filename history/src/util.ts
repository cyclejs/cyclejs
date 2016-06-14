import {Location, Pathname} from './interfaces';

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
  state: undefined,
  key: null,
  query: null,
};

export function createLocation(location?: Location | Pathname): Location {
  if (typeof location === 'string') {
    return (<any> Object).assign({}, locationDefaults, {pathname: location});
  }
  return (<any> Object).assign({}, locationDefaults, location);
}
