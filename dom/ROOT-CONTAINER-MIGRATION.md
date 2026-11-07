# Root Containers Without an ID

A root VNode with no ID now matches a container with no ID when their tag and
class names match. Previously an absent selector ID (`undefined`) did not match
the container's empty ID (`''`), so an extra same-tag element was nested inside
the container. This also affected `main` and `head` roots.

For example, rendering `h('main', [h('p', 'content')])` into `<main></main>` now
produces `<main><p>content</p></main>`, not `<main><main>...</main></main>`.
The existing native container remains the root; a duplicate child is not created.
Directly reused roots retain an isolation marker so the driver's root registration
survives the patch, just as it does for a generated wrapper.

This is an observable DOM structure change. Review selectors such as
`main > main`, styles and tests that relied on the accidental extra wrapper. To
retain an intentional nested structure, give the container a distinct ID while
leaving that ID off the child VNode, or use a distinct child tag.

Containers with an explicit ID still require that ID on the VNode to match.
Different tags, mismatched classes, or an ID present on only one side retain the
wrapper. Matching explicit IDs, null-VNode clearing and DocumentFragment wrapping
continue to use their existing behavior. This narrowly scoped fix does not alter
the existing case comparison policy or implement SVG-specific root identity.

With dependencies installed, set `CHROME_BIN` to an installed Chrome executable
and run `pnpm run test-root-matching` from `dom/`. The local Karma runner uses
loopback only, no BrowserStack account, and tests native elements plus the actual
DOM driver. Add `--all` to run the complete browser configuration locally.
