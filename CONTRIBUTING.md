First of all, thank you for contributing. It’s appreciated.

# To submit a pull request

1. Open a GitHub issue before doing significant amount of work.
2. Clone the repo. If it was already cloned, then git pull to get the latest from master.
3. Use a Linux or Mac computer. Windows might work, but we cannot test that.
4. Ensure pnpm is [installed](https://pnpm.js.org/docs/en/installation.html) (version `3.5.x` or higher).
5. Run `pnpm install && pnpm recursive install` before anything else, and wait.
6. RUN `pnpm recursive run build` to prebuild all cyclejs packages
7. Write code.
8. Run `cd dom && pnpm test` (replace `dom` with the package you are testing) to lint and test. Don’t commit before fixing all errors and warnings.
9. Commit using `pnpm run commit` and follow the CLI instructions.
10. Make a pull request.

# To release new versions

1. Check that you have npm publishing rights before anything else.
2. Run `pnpm run check-release`.
3. Run `pnpm run release-all` or `npm run release -- minor dom` (assuming you want to release a new minor version for `dom`)
