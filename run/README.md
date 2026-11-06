- [**Read the docs here**](https://cycle.js.org/api/run.html)
- [**Edit the docs here**](https://github.com/cyclejs/cyclejs/blob/master/docs/content/api/run.md)

## Legacy adapt entrypoint

`@cycle/run/lib/adapt` remains supported. The build generates a CommonJS
forwarder and a declaration re-export to `lib/cjs/adapt`, rather than relocating
the compiled module and its relative source map. Both import paths therefore
use the same module, while the canonical CJS and ES6 source maps stay beside
their compiled files.

Run `pnpm test` in this directory to run the existing tests and the entrypoint
regression checks. `pnpm run test-entrypoints` builds both module formats and
checks map source paths, module identity, shared adapter state, and declaration
consumption with the package's TypeScript compiler. These are package-level
checks, not a full browser or monorepo integration matrix.
