declare module 'es6-map' {
  const MapPolyfill: {new <K, V>(...args: Array<any>): Map<K, V>};
  export = MapPolyfill;
}
