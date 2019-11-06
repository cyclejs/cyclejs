## 7.4.0 (2019-11-06)




## 7.3.0 (2019-09-10)




## 7.2.0 (2019-07-01)

* feat(history): complete support for history.push API (#890) ([efff1ce](https://github.com/cyclejs/cyclejs/commit/efff1ce)), closes [#890](https://github.com/cyclejs/cyclejs/issues/890)



## 7.1.0 (2018-12-10)

* fix(history): support TypeScript's strict mode ([1c25cab](https://github.com/cyclejs/cyclejs/commit/1c25cab))



## 7.0.0 (2018-10-17)

* fix(history): support TypeScript 3.1 ([4be72b2](https://github.com/cyclejs/cyclejs/commit/4be72b2))
* refactor(history): move history tests to browserstack, run skipped tests ([8a1d5f6](https://github.com/cyclejs/cyclejs/commit/8a1d5f6))


### BREAKING CHANGE

* If you use JavaScript, there are no breaking changes. If you use
TypeScript, this package may not work anymore with versions of TS below
3.1.


<a name="6.10.0"></a>
# 6.10.0 (2017-11-27)


### Bug Fixes

* **history:** add [@types](https://github.com/types)/history as dependency ([d4e572f](https://github.com/cyclejs/cyclejs/commit/d4e572f)), closes [#741](https://github.com/cyclejs/cyclejs/issues/741)



<a name="6.9.0"></a>
# 6.9.0 (2017-11-14)


### Bug Fixes

* **history:** fix captureClicks listener cleanup ([5b5ce9b](https://github.com/cyclejs/cyclejs/commit/5b5ce9b))



<a name="6.8.0"></a>
# 6.8.0 (2017-10-26)


### Bug Fixes

* **history:** reduce ambiguity in package.json dependencies ([923e649](https://github.com/cyclejs/cyclejs/commit/923e649))



<a name="6.7.0"></a>
# 6.7.0 (2017-10-24)



<a name="6.6.0"></a>
# 6.6.0 (2017-10-24)



<a name="6.5.0"></a>
# 6.5.0 (2017-10-19)


### Bug Fixes

* **history:** update history to v4.7.x ([9f22678](https://github.com/cyclejs/cyclejs/commit/9f22678))



<a name="6.4.0"></a>
# 6.4.0 (2017-08-12)



<a name="6.3.0"></a>
# 6.3.0 (2017-07-20)


### Bug Fixes

* **history:** update TypeScript to v2.4 ([2c2583e](https://github.com/cyclejs/cyclejs/commit/2c2583e))



<a name="6.2.0"></a>
# 6.2.0 (2017-05-16)


### Features

* **history:** update history dependency to v4.6 ([04d1e4c](https://github.com/cyclejs/cyclejs/commit/04d1e4c))



<a name="6.1.0"></a>
# 6.1.0 (2017-03-16)


### Features

* **history:** update makeHistoryDriver to accept History object ([a065c49](https://github.com/cyclejs/cyclejs/commit/a065c49))



<a name="6.0.0"></a>
# 6.0.0 (2017-03-06)


### Bug Fixes

* **history:** make the drivers type-checkable by TypeScript 2.2 ([3f24624](https://github.com/cyclejs/cyclejs/commit/3f24624))


### BREAKING CHANGES

* history: If you are using JavaScript, literally nothing changed. If you are using TypeScript, notice that
this version may catch errors that were not catched before, but these errors indicate real
issues/bugs in your application.

ISSUES CLOSED: 542



<a name="5.0.0"></a>
# 5.0.0 (2017-02-22)

**See the changelog for all the `rc` versions of v5.0.0.**


<a name="5.0.0-rc.2"></a>
# 5.0.0-rc.2 (2017-02-21)


### Bug Fixes

* **history:** fix history drivers to start emitting the current location ([09c06eb](https://github.com/cyclejs/cyclejs/commit/09c06eb))
* **history:** make cycle/run a hard dependency ([ad2058a](https://github.com/cyclejs/cyclejs/commit/ad2058a))
* **history:** rewrite for Cycle Unified ([d41bdae](https://github.com/cyclejs/cyclejs/commit/d41bdae))
* **history:** use mjackson/history v4.5 ([ef3f467](https://github.com/cyclejs/cyclejs/commit/ef3f467))


### Features

* **history:** update and simplify api ([705673b](https://github.com/cyclejs/cyclejs/commit/705673b))


### BREAKING CHANGES

* history: New API. You no longer need createHistory() calls that
create history objects to be passed to makeHistoryDriver(). You simply
call makeHistoryDriver() and those history objects are created under the
hood.
* history: ![yes](https://img.shields.io/badge/will%20it%20affect%20me%3F-yes-red.svg)
We updated the underlying history library from v3 to v4. The API for this driver changed, you no longer need to provide the low-level history object to the driver. Just choose your desired history driver, e.g. makeServerHistoryDriver() or makeHistoryDriver() or makeHashHistoryDriver() which may accept an optional options object.
makeHistoryDriver(history: History, options?: HistoryOptions) ->  makeHistoryDriver(options?: BrowserHistoryOptions)
new API - makeServerHistoryDriver (options?: MemoryHistoryOptions)
new API - makeHashHistoryDriver(options?: HashHistoryOptions)
captureClicks is now provided as a Higher Order Driver  \\`captureClicks(makeHistoryDriver())\\`

ISSUES CLOSED: 434 465



<a name="5.0.0-rc.1"></a>
# 5.0.0-rc.1 (2017-02-03)


### Bug Fixes

* **history:** make cycle/run a hard dependency ([ad2058a](https://github.com/cyclejs/cyclejs/commit/ad2058a))
* **history:** rewrite for Cycle Unified ([d41bdae](https://github.com/cyclejs/cyclejs/commit/d41bdae))
* **history:** use mjackson/history v4.5 ([ef3f467](https://github.com/cyclejs/cyclejs/commit/ef3f467))


### Features

* **history:** update and simplify api ([705673b](https://github.com/cyclejs/cyclejs/commit/705673b))


### BREAKING CHANGES

* history: New API. You no longer need createHistory() calls that
create history objects to be passed to makeHistoryDriver(). You simply
call makeHistoryDriver() and those history objects are created under the
hood.
* history: ![yes](https://img.shields.io/badge/will%20it%20affect%20me%3F-yes-red.svg)
We updated the underlying history library from v3 to v4. The API for this driver changed, you no longer need to provide the low-level history object to the driver. Just choose your desired history driver, e.g. makeServerHistoryDriver() or makeHistoryDriver() or makeHashHistoryDriver() which may accept an optional options object.
makeHistoryDriver(history: History, options?: HistoryOptions) ->  makeHistoryDriver(options?: BrowserHistoryOptions)
new API - makeServerHistoryDriver (options?: MemoryHistoryOptions)
new API - makeHashHistoryDriver(options?: HashHistoryOptions)
captureClicks is now provided as a Higher Order Driver  \\`captureClicks(makeHistoryDriver())\\`

ISSUES CLOSED: 434 465



<a name="4.0.2"></a>
## 4.0.2 (2016-12-21)



<a name="4.0.2"></a>
## 4.0.2 (2016-10-14)


### Bug Fixes

* **history:** use ponyfill for ES6 Object.assign ([dec9c61](https://github.com/cyclejs/cyclejs/commit/dec9c61))



<a name="4.0.1"></a>
## 4.0.1 (2016-09-13)


### Bug Fixes

* **history:** fix scope of captureClicks to properly exclude hash links  ([86433e2](https://github.com/cyclejs/cyclejs/commit/86433e2))



# v4.0.0 (2016-06-14)


## Features

- **src:** Updates to history 3.x.x (#26)
  ([8e7d0bc4](https://github.com/git+https://github.com/cyclejs/history.git/commits/8e7d0bc4ac122deca4b64c4b84f9f3f73ba29b7a))


# v3.1.0 (2016-05-03)


## Features

- **ServerHistory:** allow imperatively completing history$ on the server.
  ([777d256e](https://github.com/git+https://github.com/cyclejs/history.git/commits/777d256e8460917f1720ee79c40a131be31ce2ab))


# v3.0.5 (2016-04-30)


# v3.0.4 (2016-04-27)


## Bug Fixes

- **package:** Fix installation errors (#20)
  ([c4b6a86f](https://github.com/git+https://github.com/cyclejs/history.git/commits/c4b6a86f53b3accee7eda45f85cc635c7d98d1d2))


# v3.0.3 (2016-04-27)


# v3.0.2 (2016-04-27)


# v3.0.1 (2016-04-26)


## Bug Fixes

- **typings:** fix typings.json so things will actually build :)
  ([ec5b8e52](https://github.com/git+https://github.com/cyclejs/history.git/commits/ec5b8e52f5a67adcc84ee1b6ffaa3a13ca29612d))


## Features

- **diversity:** support Cycle Diversity. (#19)
  ([2ea7ea69](https://github.com/git+https://github.com/cyclejs/history.git/commits/2ea7ea6916b7cf24f704dea918b25756bd8139a1))


