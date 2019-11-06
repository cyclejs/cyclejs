## 10.4.0 (2019-11-06)




## 10.3.0 (2019-09-10)




## 10.2.0 (2018-12-10)

* fix(rxjs-run): support TypeScript's strict mode ([e4fe427](https://github.com/cyclejs/cyclejs/commit/e4fe427))



## 10.1.0 (2018-10-17)

* fix(rxjs-run): support TypeScript 3.1 ([8ff936f](https://github.com/cyclejs/cyclejs/commit/8ff936f))
* fix(rxjs-run): update RxJS to 6.3.x ([8ce36f1](https://github.com/cyclejs/cyclejs/commit/8ce36f1))


### BREAKING CHANGE

* If you use JavaScript, there are no breaking changes. If you use
TypeScript, this package may not work anymore with versions of TS below
3.1.


## 9.3.0 (2018-09-04)

* refactor(rxjs-run): move rxjs-run tooling to pnpm ([38ad9d6](https://github.com/cyclejs/cyclejs/commit/38ad9d6))



<a name="9.1.0"></a>
# 9.1.0 (2018-07-01)


### Bug Fixes

* **rxjs-run:** always require symbol-observable polyfill ([e1e0095](https://github.com/cyclejs/cyclejs/commit/e1e0095))



<a name="9.0.0"></a>
# 9.0.0 (2018-06-25)


### Bug Fixes

* **rxjs-run:** require rxjs 6 or higher ([ca96d91](https://github.com/cyclejs/cyclejs/commit/ca96d91))


### Features

* **rxjs-run:** compitible with RXJS6 ([67edc22](https://github.com/cyclejs/cyclejs/commit/67edc22))



<a name="8.0.0"></a>
# 8.0.0 (2017-11-10)


### Bug Fixes

* **rxjs-run:** depend on run v4 ([4032e40](https://github.com/cyclejs/cyclejs/commit/4032e40))


### BREAKING CHANGES

* **rxjs-run:** Like Cycle run() v4, RxJS run() will not anymore execute synchronously once the run() function is
called, instead it will schedule sink emissions as microtasks that happen as soon as the current
event loop scripts are completed.



<a name="7.3.0"></a>
# 7.3.0 (2017-10-26)


### Bug Fixes

* **rxjs-run:** reduce ambiguity in package.json dependencies ([6aeac83](https://github.com/cyclejs/cyclejs/commit/6aeac83))



<a name="7.2.0"></a>
# 7.2.0 (2017-10-24)



<a name="7.1.0"></a>
# 7.1.0 (2017-08-12)



<a name="7.0.0"></a>
# 7.0.0 (2017-03-16)


### Bug Fixes

* **rxjs-run:** optimize bundle size of rxjs ([7224237](https://github.com/cyclejs/cyclejs/commit/7224237))


### BREAKING CHANGES

* rxjs-run: Consumer will need to add operators individually.

ISSUES CLOSED: #510



<a name="6.1.0"></a>
# 6.1.0 (2017-03-06)


### Bug Fixes

* **rxjs-run:** catch less impossible-to-satisfy TypeScript errors ([681c783](https://github.com/cyclejs/cyclejs/commit/681c783))



<a name="6.0.0"></a>
# 6.0.0 (2017-03-05)


### Bug Fixes

* **rxjs-run:** check for matching stream types in sinks and drivers ([7c7c743](https://github.com/cyclejs/cyclejs/commit/7c7c743))


### BREAKING CHANGES

* rxjs-run: If you are using JavaScript, literally nothing changes. If you are using
TypeScript, this version may detect more errors than before, and may
break (by not compiling) your existing code if your existing code
happened to have a sneaky bug.

ISSUES CLOSED: 541



<a name="5.0.0"></a>
# 5.0.0 (2017-03-05)


### Bug Fixes

* **rxjs-run:** type check keyof drivers and main with TypeScript 2.2 ([1d72b64](https://github.com/cyclejs/cyclejs/commit/1d72b64))


### BREAKING CHANGES

* rxjs-run: If you are using JavaScript, literally nothing has changed, and this
is not a breaking release. However, if you are using TypeScript, this
version may catch errors and typos that previous Cycle Run versions
didnt. Also, this version expects that if Sinks of main() are typed,
they must be a type alias, not an interface. Usually you should leave
the Sinks object implicitly typed, but we also support type aliases if
you want to explicitly type them.

ISSUES CLOSED: 538



<a name="4.1.0"></a>
# 4.1.0 (2017-02-22)


### Bug Fixes

* **rxjs-run:** use non-rc cycle/run dependency ([21751cb](https://github.com/cyclejs/cyclejs/commit/21751cb))



<a name="4.0.0"></a>
# 4.0.0 (2017-02-22)

**See the changelog for all the `rc` versions of v4.0.0.**



<a name="4.0.0-rc.6"></a>
# 4.0.0-rc.6 (2017-02-08)


### Bug Fixes

* **rxjs-run:** update cycle/run to 1.0.0-rc.9 ([7209814](https://github.com/cyclejs/cyclejs/commit/7209814))



<a name="4.0.0-rc.5"></a>
# 4.0.0-rc.5 (2017-02-03)


### Bug Fixes

* **rxjs-run:** update run to v1.0.0-rc.8 ([2877010](https://github.com/cyclejs/cyclejs/commit/2877010))



<a name="4.0.0-rc.3"></a>
# 4.0.0-rc.3 (2017-01-19)


### Bug Fixes

* **rxjs-run:** use run v1.0.0-rc.7 ([dab8bb5](https://github.com/cyclejs/cyclejs/commit/dab8bb5))



<a name="4.0.0-rc.2"></a>
# 4.0.0-rc.2 (2016-12-14)

* **rxjs-run:** use run rc6, where sinks are not adapted ([93af810](https://github.com/cyclejs/cyclejs/commit/93af810))

<a name="3.3.0"></a>
# 3.3.0 (2016-12-22)


### Bug Fixes

* **rxjs-run:** remove dependency on types/es6-promise ([e3d31ef](https://github.com/cyclejs/cyclejs/commit/e3d31ef))



<a name="3.2.0"></a>
# 3.2.0 (2016-12-21)


### Bug Fixes

* **rxjs-run:** correctly depend on rxjs-adapter v3.1 ([b039cf4](https://github.com/cyclejs/cyclejs/commit/b039cf4))



<a name="3.1.0"></a>
# 3.1.0 (2016-12-05)


### Bug Fixes

* **rxjs-run:** update dependency cycle/base to v4.2 ([976a182](https://github.com/cyclejs/cyclejs/commit/976a182))



<a name="3.0.3"></a>
## 3.0.3 (2016-07-31)


### Bug Fixes

* **rxjs-run:** fix major versions of dependencies ([d568161](https://github.com/cyclejs/cyclejs/commit/d568161))



<a name="3.0.2"></a>
## 3.0.2 (2016-07-16)



