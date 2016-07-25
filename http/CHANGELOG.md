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



