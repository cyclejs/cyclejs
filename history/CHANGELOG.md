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


