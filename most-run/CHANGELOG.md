## 8.3.0 (2019-09-10)




## 8.2.0 (2018-12-10)

* fix(most-run): support TypeScript's strict mode ([98b256b](https://github.com/cyclejs/cyclejs/commit/98b256b))



## 8.1.0 (2018-10-17)

* fix(most-run): support TypeScript 3.1 ([b60fa96](https://github.com/cyclejs/cyclejs/commit/b60fa96))
* refactor(most-run): move most-run tooling to pnpm ([80578f0](https://github.com/cyclejs/cyclejs/commit/80578f0))


### BREAKING CHANGE

* If you use JavaScript, there are no breaking changes. If you use
TypeScript, this package may not work anymore with versions of TS below
3.1.


<a name="8.0.0"></a>
# 8.0.0 (2017-11-10)


### Bug Fixes

* **most-run:** depend on run v4 ([52a1a62](https://github.com/cyclejs/cyclejs/commit/52a1a62))


### BREAKING CHANGES

* **most-run:** cycle/run v4 is a breaking change, so also the new version for most-run must be a breaking change



<a name="7.4.0"></a>
# 7.4.0 (2017-10-26)


### Bug Fixes

* **most-run:** reduce ambiguity in package.json dependencies ([e6077fe](https://github.com/cyclejs/cyclejs/commit/e6077fe))



<a name="7.3.0"></a>
# 7.3.0 (2017-10-24)



<a name="7.2.0"></a>
# 7.2.0 (2017-08-12)



<a name="7.1.0"></a>
# 7.1.0 (2017-03-06)


### Bug Fixes

* **most-run:** catch less impossible-to-satisfy TypeScript errors ([0a45529](https://github.com/cyclejs/cyclejs/commit/0a45529))



<a name="7.0.0"></a>
# 7.0.0 (2017-03-05)


### Bug Fixes

* **most-run:** check for matching stream types in sinks and drivers ([06dd793](https://github.com/cyclejs/cyclejs/commit/06dd793))


### BREAKING CHANGES

* most-run: If you are using JavaScript, literally nothing changes. If you are using
TypeScript, this version may detect more errors than before, and may
break (by not compiling) your existing code if your existing code
happened to have a sneaky bug.

ISSUES CLOSED: 541



<a name="6.0.0"></a>
# 6.0.0 (2017-03-05)


### Bug Fixes

* **most-run:** type check keyof drivers and main with TypeScript 2.2 ([4597b3e](https://github.com/cyclejs/cyclejs/commit/4597b3e))


### BREAKING CHANGES

* most-run: If you are using JavaScript, literally nothing has changed, and this
is not a breaking release. However, if you are using TypeScript, this
version may catch errors and typos that previous Cycle Run versions
didnt. Also, this version expects that if Sinks of main() are typed,
they must be a type alias, not an interface. Usually you should leave
the Sinks object implicitly typed, but we also support type aliases if
you want to explicitly type them.

ISSUES CLOSED: 538



<a name="5.1.0"></a>
# 5.1.0 (2017-02-22)


### Bug Fixes

* **most-run:** use non-rc cycle/run dependency ([d098871](https://github.com/cyclejs/cyclejs/commit/d098871))



<a name="5.0.0"></a>
# 5.0.0 (2017-02-22)

**See the changelog for all the `rc` versions of v5.0.0.**


<a name="5.0.0-rc.5"></a>
# 5.0.0-rc.5 (2017-02-08)


### Bug Fixes

* **most-run:** update cycle/run to 1.0.0-rc.9 ([cf68d2c](https://github.com/cyclejs/cyclejs/commit/cf68d2c))



<a name="5.0.0-rc.4"></a>
# 5.0.0-rc.4 (2017-02-03)


### Bug Fixes

* **most-run:** support most v1.2 ([d643732](https://github.com/cyclejs/cyclejs/commit/d643732))
* **most-run:** update run to v1.0.0-rc.8 ([da7f1ec](https://github.com/cyclejs/cyclejs/commit/da7f1ec))



<a name="5.0.0-rc.3"></a>
# 5.0.0-rc.3 (2017-02-03)


### Bug Fixes

* **most-run:** support most v1.2 ([d643732](https://github.com/cyclejs/cyclejs/commit/d643732))



<a name="5.0.0-rc.2"></a>
# 5.0.0-rc.2 (2016-12-14)


### Bug Fixes

* **most-run:** use run rc6, where sinks are not adapted ([a792ff1](https://github.com/cyclejs/cyclejs/commit/a792ff1))

<a name="4.4.0"></a>
# 4.4.0 (2016-12-21)



<a name="4.3.0"></a>
# 4.3.0 (2016-12-05)


### Bug Fixes

* **most-run:** update dependency cycle/base to v4.2 ([dc754b7](https://github.com/cyclejs/cyclejs/commit/dc754b7))



<a name="4.2.0"></a>
# 4.2.0 (2016-11-16)


### Features

* **most-run:** update to latest dependencies ([d586ab3](https://github.com/cyclejs/cyclejs/commit/d586ab3))



<a name="4.1.3"></a>
## 4.1.3 (2016-10-17)


### Bug Fixes

* **most-run:** fix Cycle() TypeScript signature of drivers object ([45468ad](https://github.com/cyclejs/cyclejs/commit/45468ad))



<a name="4.1.2"></a>
## 4.1.2 (2016-10-14)


### Bug Fixes

* **most-run:** fix run() TypeScript signature of drivers object ([fee7545](https://github.com/cyclejs/cyclejs/commit/fee7545))



<a name="4.1.1"></a>
## 4.1.1 (2016-09-13)


### Bug Fixes

* **most-run:** export run function  ([e409bf9](https://github.com/cyclejs/cyclejs/commit/e409bf9))



<a name="4.1.0"></a>
# 4.1.0 (2016-08-21)


### Features

* **most-run:** update cycle base run() to v4.1 ([e7801fa](https://github.com/cyclejs/cyclejs/commit/e7801fa))



<a name="4.0.0"></a>
# 4.0.0 (2016-08-09)


### Features

* **most-run:** update most to v1.0.0 ([ce35480](https://github.com/cyclejs/cyclejs/commit/ce35480))


### BREAKING CHANGES

* most-run: Updates most to v1.0.0 which is known to be a breaking version in relation to the previous v0.19



<a name="3.0.1"></a>
## 3.0.1 (2016-07-16)



