First of all, thank you for contributing. It’s appreciated.

# To submit a pull request

1. Open a GitHub issue before doing significant amount of work.
2. Clone the repo. If it was already cloned, then git pull to get the latest from master.
3. Use a Linux or Mac computer. No Windows, sorry.
4. Run `make setup` before anything else, and wait.
5. Write code.
6. Run `make test dom` (replace `dom` with the package you are testing) to lint and test. Don’t commit before fixing all errors and warnings.
7. Commit using `make commit` and follow the CLI instructions.
8. Make a pull request.

# To release new versions

1. Check that you have npm publishing rights before anything else.
2. Run `make check-release`.
3. Run `make release-all`.
