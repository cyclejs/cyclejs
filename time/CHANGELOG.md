## 0.18.0 (2018-12-02)

* fix(time): unsubscribes Time operators on complete (#858) ([71dc4df](https://github.com/cyclejs/cyclejs/commit/71dc4df)), closes [#858](https://github.com/cyclejs/cyclejs/issues/858) [#848](https://github.com/cyclejs/cyclejs/issues/848)



## 0.16.0 (2018-10-17)

* fix(time): support TypeScript 3.1 ([0c61222](https://github.com/cyclejs/cyclejs/commit/0c61222))
* fix(time): update cycle/run to v4 ([fe3175c](https://github.com/cyclejs/cyclejs/commit/fe3175c))
* test(time): fix time tests ([f365dec](https://github.com/cyclejs/cyclejs/commit/f365dec))


### BREAKING CHANGE

* If you use JavaScript, there are no breaking changes. If you use
TypeScript, this package may not work anymore with versions of TS below
3.1.


<a name="0.15.0"></a>
# 0.15.0 (2018-07-30)



<a name="0.13.0"></a>
# 0.13.0 (2018-02-16)


### Bug Fixes

* **time:** fix event processing ([#771](https://github.com//cyclejs/cyclejs/issues/771)) ([2361c00](https://github.com/cyclejs/cyclejs/commit/2361c00))
* **time:** fix rxjs and most entrypoints ([c31b60d](https://github.com/cyclejs/cyclejs/commit/c31b60d))
* **time:** fix throttle immediately completing with sync producer ([3bb2271](https://github.com/cyclejs/cyclejs/commit/3bb2271)), closes [#770](https://github.com/cyclejs/cyclejs/issues/770)



<a name="0.12.0"></a>
# 0.12.0 (2017-12-28)


### Bug Fixes

* **time:** fix error propagation ([82f313e](https://github.com/cyclejs/cyclejs/commit/82f313e))
* **time:** fix raf import ([18340cb](https://github.com/cyclejs/cyclejs/commit/18340cb))


### Features

* **time:** add dispose function to TimeSource ([e36b4d9](https://github.com/cyclejs/cyclejs/commit/e36b4d9))



<a name="0.11.0"></a>
# 0.11.0 (2017-12-28)


### Bug Fixes

* **time:** reduce ambiguity in package.json dependencies ([8956395](https://github.com/cyclejs/cyclejs/commit/8956395))



<a name="0.10.1"></a>
## 0.10.1 (2017-10-05)


### Bug Fixes

* **time:** ignore node.js specific modules in React Native ([1db307d](https://github.com/cyclejs/cyclejs/commit/1db307d))



<a name="0.10.0"></a>
# 0.10.0 (2017-09-04)


### Bug Fixes

* **time:** comparator can return a boolean ([45417b9](https://github.com/cyclejs/cyclejs/commit/45417b9))


### Features

* **time:** support creating custom operators with Time.createOperator() ([d218064](https://github.com/cyclejs/cyclejs/commit/d218064))



<a name="0.9.1"></a>
## 0.9.1 (2017-08-30)


### Bug Fixes

* **time:** include lib/ in compiled package ([49a653e](https://github.com/cyclejs/cyclejs/commit/49a653e))



<a name="0.9.0"></a>
# 0.9.0 (2017-08-30)


### Bug Fixes

* **time:** fix periodic dropping behind in background tab ([d14177c](https://github.com/cyclejs/cyclejs/commit/d14177c))


### Features

* **time:** use setImmediate to run events in background ([30d3ea3](https://github.com/cyclejs/cyclejs/commit/30d3ea3)), closes [#37](https://github.com/cyclejs/cyclejs/issues/37)
* **time:** use setInterval for processing loop ([040e254](https://github.com/cyclejs/cyclejs/commit/040e254))



