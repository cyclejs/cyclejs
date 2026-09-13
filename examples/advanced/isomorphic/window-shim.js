// snabbdom>=3 (bundled with @cycle/dom) touches `window` at import time.
// The server never uses DOM APIs (rendering goes through @cycle/html
// strings), so a minimal stub suffices to run this file under Node.js.
// `history.pushState` is a no-op on the server: there is no navigation.
// This module must be imported before any other local module.
if (typeof window === 'undefined') {
  global.window = {history: {pushState: () => {}}};
}
