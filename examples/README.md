# Cycle.js Examples

Choose a concept, then read its source tour and limitations. See
[Running the examples](./RUNNING.md) before installing these historical packages.

## Usage

From an example directory, `npm start` installs dependencies and builds its bundle.
Open its `index.html` after a successful build. Isomorphic is a server example,
not a static page; its guide explains the legacy migration requirement.

## Basic

| Example | Main concept |
| --- | --- |
| [Hello world](./basic/hello-world/README.md) | Input events become a greeting |
| [Checkbox](./basic/checkbox/README.md) | Boolean state and an initial view |
| [Counter](./basic/counter/README.md) | Merge actions and fold state |
| [HTTP random user](./basic/http-random-user/README.md) | Categorized request/response streams |
| [BMI naive](./basic/bmi-naive/README.md) | Combine inputs with legacy RxJS |
| [JSX seconds elapsed](./basic/jsx-seconds-elapsed/README.md) | Time driver and JSX |

## Intermediate

| Example | Main concept |
| --- | --- |
| [Animation](./intermediate/animation/README.md) | Sequential tweens and switching |
| [BMI TypeScript](./intermediate/bmi-typescript/README.md) | Typed, isolated child components |
| [Hello lastname](./intermediate/hello-lastname/README.md) | Input combination and validation |
| [HTTP GitHub search](./intermediate/http-search-github/README.md) | Debounce and response categories |
| [TSX seconds elapsed](./intermediate/tsx-seconds-elapsed/README.md) | Typed Time source and TSX |

## Advanced

| Example | Main concept |
| --- | --- |
| [Animated letters](./advanced/animated-letters/README.md) | State differences and animation |
| [Autocomplete search](./advanced/autocomplete-search/README.md) | Focus, keyboard, JSONP and reducers |
| [BMI nested](./advanced/bmi-nested/README.md) | Reusable isolated sliders |
| [Custom driver](./advanced/custom-driver/README.md) | Encapsulate Chart.js effects |
| [Isomorphic](./advanced/isomorphic/README.md) | Shared view; migration needed |
| [Many](./advanced/many/README.md) | Dynamic children and removal feedback |
| [Nested folders](./advanced/nested-folders/README.md) | Recursive onion state collections |
| [Routing view](./advanced/routing-view/README.md) | Hash history source and sink |

## Study guide

Start with the examples under the basic folder in this order:

1. hello-world
2. checkbox
3. counter
4. http-random-user
5. bmi-naive

This will get you introduced to one main concept with each example. Make sure
to reach for each example's README file for more context.

## Documentation Check

With Node 12 or newer and root development dependencies installed, run
`node .scripts/check-example-docs.js` from the repository root. Add
`--base=HEAD~1` after a documentation commit to verify source edits against Git.
This offline check is not an application build or browser test.
The checker uses the Markdown parser in the existing documentation toolchain and
TypeScript's parser. `node .scripts/test-example-docs.js` exercises positive and
negative fixtures without installing example packages.
