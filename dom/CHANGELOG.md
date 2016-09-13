<a name="12.2.5"></a>
## 12.2.5 (2016-09-13)


### Bug Fixes

* **dom:** retain event streams when isolated parent is recreated ([5b37dd0](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/5b37dd0))



<a name="12.2.4"></a>
## 12.2.4 (2016-09-04)


### Bug Fixes

* **dom:** fix small obstacle to using web components ([a74551c](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/a74551c))



<a name="12.2.3"></a>
## 12.2.3 (2016-09-02)


### Bug Fixes

* **dom:** small refactor, safe to upgrade ([2e3de51](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/2e3de51))



<a name="12.2.2"></a>
## 12.2.2 (2016-08-25)


### Bug Fixes

* **dom:** slightly faster IsolateModule ([0126d2e](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/0126d2e))



<a name="12.2.1"></a>
## 12.2.1 (2016-08-21)


### Bug Fixes

* **dom:** use a fixed major version of xstream-adapter ([549180b](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/549180b))



<a name="12.2.0"></a>
# 12.2.0 (2016-08-21)


### Features

* **dom:** support the Chrome DevTool to distinguish source streams ([053718c](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/053718c))



<a name="12.1.0"></a>
# 12.1.0 (2016-08-14)


### Features

* **dom:** add support for selecting `document` and `body` ([93bd3c4](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/93bd3c4))



<a name="12.0.3"></a>
## 12.0.3 (2016-08-01)


### Bug Fixes

* **dom:** fix support for SVG polyline ([d0eb12c](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/d0eb12c))



<a name="12.0.2"></a>
## 12.0.2 (2016-07-31)


### Performance Improvements

* **dom:** clear out delegator destinations for stopped streams ([a9268e0](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/a9268e0))



<a name="12.0.1"></a>
## 12.0.1 (2016-07-31)


### Bug Fixes

* **dom:** use isolation scope as snabbdom key ([b763d25](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/b763d25))



<a name="12.0.0"></a>
# 12.0.0 (2016-07-29)


### Features

* **dom:** html driver supports multiple emissions ([c02dfe8](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/c02dfe8))


### BREAKING CHANGES

* dom: This is a breaking change because previously the HTML driver was guaranteed to render just one HTML
string and consume it in the effect function. Now, the HTML driver may render multiple HTML strings
over time and give those to the effect function. If you don't use the HTML Driver, you can safely
upgrade your app to this version of Cycle DOM. If you do use the HTML driver, make sure the sink
(stream of virtual DOM) given to the HTML driver emits just once. Just add last() for server-side
rendered virtual DOM streams. Otherwise, the effect function of the HTML driver may be called
multiple times.

ISSUES CLOSED: #348



<a name="11.0.1"></a>
## 11.0.1 (2016-07-22)


### Bug Fixes

* **dom:** use snabbdom exactly 0.5.0 as a fixed version ([642bd6c](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/642bd6c))



<a name="11.0.0"></a>
# 11.0.0 (2016-07-21)


### Bug Fixes

* **dom:** update Snabbdom to v0.5.0 ([6ec38f0](https://github.com/cyclejs/cyclejs/tree/master/packages/dom/commit/6ec38f0))


### BREAKING CHANGES

* dom: Thunk API changed. Particularly, it now takes a key argument (2nd parameter) and the stateArguments
parameter (4th parameter) must always be an array.

ISSUES CLOSED: #351.



