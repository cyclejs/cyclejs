First of all, thank you for contributing. It’s appreciated.

1. Clone the repo and install dependencies with `npm install`.
2. Make a GitHub issue before doing significant amount of work.
3. Run `npm test` to lint and test. Don’t commit before fixing all errors and warnings.
  - Use `npm run test-node` to run a subset of Mocha tests specific for Node.js.
  - Use `npm run test-browser` to run a subset of Mocha tests specific to browsers.
  - Note: `npm test-browser` will attempt to open a tab in Chrome.
4. Reference the issue’s number in your commit. E.g.: “Did this #12”
5. Make a pull request.

Prior to v1.0, the versions will follow the convention: improvements that break backwards
compatibility increment the minor number, any other improvements will increment the patch
number. After v1.0, we will follow [http://semver.org/](semver).
