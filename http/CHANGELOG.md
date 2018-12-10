## 15.1.0 (2018-12-10)

* fix(http): support TypeScript's strict mode ([a6e370e](https://github.com/cyclejs/cyclejs/commit/a6e370e))



## 15.0.0 (2018-10-17)

* chore(http): split a test in two, reduce CI flakiness ([c231235](https://github.com/cyclejs/cyclejs/commit/c231235))
* fix(http): support Typescript 3.1 ([d51f882](https://github.com/cyclejs/cyclejs/commit/d51f882))


### BREAKING CHANGE

* If you use JavaScript, there are no breaking changes. If you use
TypeScript, then you may have to change some imports, only if you are
using RxJS or Most.js. If you are using RxJS: change
`import {makeHTTPDriver} from '@cycle/http'` to
`import {makeHTTPDriver} from '@cycle/http/lib/cjs/rxjs'` and change
`import {HTTPSource} from '@cycle/http/rxjs-typings'` to
`import {HTTPSource} from '@cycle/http/lib/cjs/rxjs'`. If you are
using Most.js: change
`import {makeHTTPDriver} from '@cycle/http'` to
`import {makeHTTPDriver} from '@cycle/http/lib/cjs/most'` and change
`import {HTTPSource} from '@cycle/http/most-typings'` to
`import {HTTPSource} from '@cycle/http/lib/cjs/most'`.


## 14.10.0 (2018-08-21)

* fix(http): update superagent to 3.8.3 ([fe3c5ce](https://github.com/cyclejs/cyclejs/commit/fe3c5ce))



<a name="14.9.0"></a>
# 14.9.0 (2018-01-23)


### Bug Fixes

* **http:** upgrade superagent to 3.8.2 ([a0d8f24](https://github.com/cyclejs/cyclejs/commit/a0d8f24))



<a name="14.8.0"></a>
# 14.8.0 (2017-10-26)


### Bug Fixes

* **http:** fix isolation regression ([ac20334](https://github.com/cyclejs/cyclejs/commit/ac20334))



<a name="14.7.0"></a>
# 14.7.0 (2017-10-25)


### Bug Fixes

* **http:** upgrade superagent to v3.7.0 ([b17ab8d](https://github.com/cyclejs/cyclejs/commit/b17ab8d))



<a name="14.6.0"></a>
# 14.6.0 (2017-10-24)



<a name="14.5.0"></a>
# 14.5.0 (2017-10-10)


### Bug Fixes

* **http:** update superagent to v3.6.3 ([c20ecc1](https://github.com/cyclejs/cyclejs/commit/c20ecc1))



<a name="14.4.0"></a>
# 14.4.0 (2017-10-02)


### Bug Fixes

* **http:** check position of isolation namespace ([e0dea73](https://github.com/cyclejs/cyclejs/commit/e0dea73))


### Features

* **http:** implement `ok` field in request objects (#684) ([63e3022](https://github.com/cyclejs/cyclejs/commit/63e3022))



<a name="14.3.0"></a>
# 14.3.0 (2017-09-05)


### Bug Fixes

* **http:** allow string type of send property ([5ea4bf3](https://github.com/cyclejs/cyclejs/commit/5ea4bf3))



<a name="14.2.0"></a>
# 14.2.0 (2017-08-15)


### Bug Fixes

* **http:** use ES6 imports to guarantee presence after tree shaking ([a6e9c74](https://github.com/cyclejs/cyclejs/commit/a6e9c74))



<a name="14.1.0"></a>
# 14.1.0 (2017-08-12)



<a name="14.0.0"></a>
# 14.0.0 (2017-07-20)


### Bug Fixes

* **http:** update to TypeScript v2.4, change HTTPSource interface ([56cdf62](https://github.com/cyclejs/cyclejs/commit/56cdf62))


### BREAKING CHANGES

* **http:** If you are a JavaScript user, there are zero breaking changes. If you use TypeScript, the
HTTPSource's filter() method has a slightly different type signature, upgrade manually and
carefully.

ISSUES CLOSED: #640



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



