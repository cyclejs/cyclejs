<a name="4.2.0"></a>
# 4.2.0 (2016-12-21)



<a name="4.1.0"></a>
# 4.1.0 (2016-12-05)


### Bug Fixes

* **xstream-run:** update dependency cycle/base to v4.2 ([1656f8c](https://github.com/cyclejs/cyclejs/tree/master/packages/xstream-run/commit/1656f8c))



<a name="4.0.0"></a>
# 4.0.0 (2016-11-28)


### Bug Fixes

* **xstream-run:** update xstream version to v9.0 ([92f48a6](https://github.com/cyclejs/cyclejs/tree/master/packages/xstream-run/commit/92f48a6))


### BREAKING CHANGES

* xstream-run: ![probably will](https://img.shields.io/badge/will%20it%20affect%20me%3F-probably%20will-orange.svg)
Updating to xstream v9.0 is backwards incompatible since earlier
versions of xstream would swallow errors when no more listeners
were attached and errors occurred. This version of Cycle
xstream-run only works with xstream v9.0 or above. Read the
[CHANGELOG for xstream
v9.0](https://github.com/staltz/xstream/blob/master/CHANGELOG.md#900-2016-11-28)
too.



<a name="3.1.0"></a>
# 3.1.0 (2016-08-22)


### Features

* **xstream-run:** support for the Cycle.js Chrome DevTool ([5ed937b](https://github.com/cyclejs/cyclejs/tree/master/packages/xstream-run/commit/5ed937b))



<a name="3.0.4"></a>
## 3.0.4 (2016-07-31)


### Bug Fixes

* **xstream-run:** fix major versions of dependencies ([603ee2a](https://github.com/cyclejs/cyclejs/tree/master/packages/xstream-run/commit/603ee2a))
* **xstream-run:** remove obsolete internal build script ([476f9b4](https://github.com/cyclejs/cyclejs/tree/master/packages/xstream-run/commit/476f9b4))



<a name="3.0.3"></a>
## 3.0.3 (2016-07-16)



