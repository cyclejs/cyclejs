// History 4.3.x typings
declare module 'history' {
  export type Action = 'PUSH' | 'REPLACE' | 'POP';

  export interface Location {
    // The path of the URL.
    pathname: string;

    // The URL query string
    search?: string;

    // The URL hash fragment
    hash?: string;

    // Some extra state for this location that does not reside
    // in the URL (supported in `createBrowserHistory` and `createMemoryHistory`).
    state?: any;
  }

  export interface LocationAndKey extends Location {
    // A unique string representing this location
    // (supported in `createBrowserHistory` and `createMemoryHistory`).
    key?: string;
  }

  export interface BlockCallback {
    (location: LocationAndKey, action?: Action): string;
  }

  export interface Unsubscribe {
    (): void;
  }

  export interface History {
    // The number of entries in the history stack.
    length: number;

    // The current location (see below).
    location: LocationAndKey;

    // The current navigation action (see below).
    action: Action;

    listen(callback: (location: LocationAndKey, action?: Action) => any): Unsubscribe;

    push(path: string, state?: any): void;
    push(location: Location): void;
    replace(path: string, state?: any): void;
    replace(location: Location): void;

    go(n: number): void;
    goBack(): void;
    goForward(): void;

    block(message: string): void;
    block(callback: BlockCallback): Unsubscribe;
  }

  export interface MemoryHistory extends History {
    index: number;
    entries: string[];

    canGo(n: number): boolean;
  }

  export interface GetUserConfirmation {
    (message: string, callback: (continueTransition: boolean) => void): void;
  }

  export interface BrowserHistoryOptions {
    // The base URL of the app.
    // Default: ''
    basename?: string;

    // Set true to force full page refreshes.
    // Default: false
    forceRefresh?: boolean;

    // The length of `location.key`.
    // Default: 6
    keyLength?: number;

    // A function to use to confirm navigation with the user.
    // Default: (message, callback) => callback(window.confirm(message))
    getUserConfirmation?: GetUserConfirmation;
  }

  export function createBrowserHistory(options?: BrowserHistoryOptions): History;

  export interface MemoryHistoryOptions {
    // The initial URLs in the history stack.
    // Default: ['/']
    initialEntries?: string[];

    // The starting index in the history stack.
    // Default: 0
    initialIndex?: number;

    // The length of `location.key`.
    // Default: 6
    keyLength?: number;

    // A function to use to confirm navigation with the user. Required
    // if you return string prompts from transition hooks.
    // Default: null
    getUserConfirmation?: GetUserConfirmation;
  }

  export function createMemoryHistory(options?: MemoryHistoryOptions): MemoryHistory;

  export type HashType = 'slash' | 'noslash' | 'hashbang';

  export interface HashHistoryOptions {
    // The base URL of the app.
    // Default: ''
    basename?: string;

    // The hash type to use.
    // Default: 'slash'
    hashType?: HashType;

    // A function to use to confirm navigation with the user.
    // Default: (message, callback) => callback(window.confirm(message))
    getUserConfirmation?: GetUserConfirmation;
  }

  export function createHashHistory(options?: HashHistoryOptions): History;

  export function createLocation(path: string | Location, state?: any,
                                 key?: string, currentLocation?: Location): LocationAndKey;
  export function locationsAreEqual(a: LocationAndKey, b: LocationAndKey): boolean;

  export function parsePath(path: string): Location;
  export function createPath(location: Location): string;
}
