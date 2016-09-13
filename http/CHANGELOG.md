<a name="11.0.1"></a>
## 11.0.1 (2016-09-13)


### Bug Fixes

* **http:** remove remember() from response$$ ([6973409](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/6973409))
* **http:** update typings of HTTPSource ([2dcd64e](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/2dcd64e))



<a name="11.0.0"></a>
# 11.0.0 (2016-08-28)


### Bug Fixes

* **http:** simplify the HTTPSource API ([f740fc1](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/f740fc1))


### BREAKING CHANGES

* http: httpSource.response$$ replaced with httpSource.select() and
httpSource.filter(res$ => ...) replaced with httpSource.filter(req =>
...) but still with same semantics and returns the same type of output:
an HTTPSource.

ISSUES CLOSED: #376



<a name="10.2.1"></a>
## 10.2.1 (2016-08-21)


### Bug Fixes

* **http:** use a fixed major version of xstream-adapter ([bc14598](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/bc14598))



<a name="10.2.0"></a>
# 10.2.0 (2016-08-21)


### Features

* **http:** support the Chrome DevTool to distinguish source streams ([cb81c23](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/cb81c23))



<a name="10.1.0"></a>
# 10.1.0 (2016-08-15)


### Features

* **http:** allow lazy (cancellable) requests  ([2417bd6](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/2417bd6))



<a name="10.0.0"></a>
# 10.0.0 (2016-07-25)


### Bug Fixes

* **http:** by default do not set Content-Type header ([3a55d4d](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/3a55d4d))


### Features

* **http:** update superagent to v2.1.0 ([34569ad](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/34569ad))


### BREAKING CHANGES

* http: This is a breaking change because it changes the default behavior of requests. Before they were
assumed to have header Content-Type application/json by default. Now they are assumed to not even
have the Content-Type header, by default.

ISSUES CLOSED: #360.
* http: This is a breaking change because superagent v1.7 => v2.1 has breaking changes. Read all about their
* http: s here: https://github.com/visionmedia/superagent/releases/tag/v2.0.0. We recommend
also to read the recent release notes: https://github.com/visionmedia/superagent/releases



<a name="9.0.3"></a>
## 9.0.3 (2016-07-19)


### Bug Fixes

* **http:** remove jspm from package.json ([ecab193](https://github.com/cyclejs/cyclejs/tree/master/packages/http/commit/ecab193))



