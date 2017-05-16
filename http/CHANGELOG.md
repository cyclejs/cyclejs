<a name="13.3.0"></a>
# 13.3.0 (2017-05-16)


### Features

* **http:** add option responseType ([df1f30a](https://github.com/cyclejs/cyclejs/commit/df1f30a))
* **http:** update superagent to v3.5.2 ([c91f37f](https://github.com/cyclejs/cyclejs/commit/c91f37f))



<a name="13.2.0"></a>
# 13.2.0 (2017-03-15)


### Bug Fixes

* **http:** add missing fields on Response type ([3701efa](https://github.com/cyclejs/cyclejs/commit/3701efa))
* **http:** handle errors when server did not respond at all ([473f059](https://github.com/cyclejs/cyclejs/commit/473f059))



<a name="13.1.0"></a>
# 13.1.0 (2017-03-08)


### Features

* **http:** accept null isolation scope to turn off isolation ([e16febc](https://github.com/cyclejs/cyclejs/commit/e16febc))



<a name="13.0.0"></a>
# 13.0.0 (2017-03-06)


### Bug Fixes

* **http:** make the drivers type-checkable by TypeScript 2.2 ([a96243e](https://github.com/cyclejs/cyclejs/commit/a96243e))


### BREAKING CHANGES

* http: If you are using JavaScript, literally nothing changed. If you
are using TypeScript, notice that this version may catch errors
that were not catched before, but these errors indicate real
issues/bugs in your application.

ISSUES CLOSED: 542



<a name="12.0.0"></a>
# 12.0.0 (2017-02-22)


### Bug Fixes

* **http:** make cycle/run a hard dependency ([dabf7d7](https://github.com/cyclejs/cyclejs/commit/dabf7d7))
* **http:** rewrite for Cycle Unified ([657ec6b](https://github.com/cyclejs/cyclejs/commit/657ec6b))
* **http:** update superagent to 3.4 ([f9ebe6f](https://github.com/cyclejs/cyclejs/commit/f9ebe6f))
* **http:** update superagent to v3.4.1 ([6c2aaf7](https://github.com/cyclejs/cyclejs/commit/6c2aaf7))


### BREAKING CHANGES

* http: Superagent had breaking changes. Check their release
notes: https://github.com/visionmedia/superagent/releases



<a name="12.0.0-rc.1"></a>
# 12.0.0-rc.1 (2017-02-03)


### Bug Fixes

* **http:** make cycle/run a hard dependency ([dabf7d7](https://github.com/cyclejs/cyclejs/commit/dabf7d7))
* **http:** rewrite for Cycle Unified ([657ec6b](https://github.com/cyclejs/cyclejs/commit/657ec6b))
* **http:** update superagent to 3.4 ([f9ebe6f](https://github.com/cyclejs/cyclejs/commit/f9ebe6f))
* **http:** update superagent to v3.4.1 ([6c2aaf7](https://github.com/cyclejs/cyclejs/commit/6c2aaf7))


### BREAKING CHANGES

* http: Superagent had breaking changes. Check their release
notes: https://github.com/visionmedia/superagent/releases



<a name="11.3.0"></a>
# 11.3.0 (2017-01-20)


### Features

* **http:** added request object to http err response ([60c2a0b](https://github.com/cyclejs/cyclejs/commit/60c2a0b))



<a name="11.2.0"></a>
# 11.2.0 (2016-10-27)


### Bug Fixes

* **http:** remove [@types](https://github.com/types)/core-js in favore of tsconfig --options ([547efca](https://github.com/cyclejs/cyclejs/commit/547efca))


### Features

* **http:** support SSL certificate authentication ([b3f841c](https://github.com/cyclejs/cyclejs/commit/b3f841c))



<a name="11.1.0"></a>
# 11.1.0 (2016-10-14)


### Features

* **http:** update to superagent v2.3.0 ([68ea0f4](https://github.com/cyclejs/cyclejs/commit/68ea0f4))



<a name="11.0.1"></a>
## 11.0.1 (2016-09-13)


### Bug Fixes

* **http:** remove remember() from response$$ ([6973409](https://github.com/cyclejs/cyclejs/commit/6973409))
* **http:** update typings of HTTPSource ([2dcd64e](https://github.com/cyclejs/cyclejs/commit/2dcd64e))



<a name="11.0.0"></a>
# 11.0.0 (2016-08-28)


### Bug Fixes

* **http:** simplify the HTTPSource API ([f740fc1](https://github.com/cyclejs/cyclejs/commit/f740fc1))


### BREAKING CHANGES

* http: httpSource.response$$ replaced with httpSource.select() and
httpSource.filter(res$ => ...) replaced with httpSource.filter(req =>
...) but still with same semantics and returns the same type of output:
an HTTPSource.

ISSUES CLOSED: #376



<a name="10.2.1"></a>
## 10.2.1 (2016-08-21)


### Bug Fixes

* **http:** use a fixed major version of xstream-adapter ([bc14598](https://github.com/cyclejs/cyclejs/commit/bc14598))



<a name="10.2.0"></a>
# 10.2.0 (2016-08-21)


### Features

* **http:** support the Chrome DevTool to distinguish source streams ([cb81c23](https://github.com/cyclejs/cyclejs/commit/cb81c23))



<a name="10.1.0"></a>
# 10.1.0 (2016-08-15)


### Features

* **http:** allow lazy (cancellable) requests  ([2417bd6](https://github.com/cyclejs/cyclejs/commit/2417bd6))



<a name="10.0.0"></a>
# 10.0.0 (2016-07-25)


### Bug Fixes

* **http:** by default do not set Content-Type header ([3a55d4d](https://github.com/cyclejs/cyclejs/commit/3a55d4d))


### Features

* **http:** update superagent to v2.1.0 ([34569ad](https://github.com/cyclejs/cyclejs/commit/34569ad))


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

* **http:** remove jspm from package.json ([ecab193](https://github.com/cyclejs/cyclejs/commit/ecab193))



