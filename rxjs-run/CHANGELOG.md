<a name="5.0.0"></a>
# 5.0.0 (2017-03-05)


### Bug Fixes

* **rxjs-run:** type check keyof drivers and main with TypeScript 2.2 ([1d72b64](https://github.com/cyclejs/cyclejs/tree/master/rxjs-run/commit/1d72b64))


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

* **rxjs-run:** use non-rc cycle/run dependency ([21751cb](https://github.com/cyclejs/cyclejs/tree/master/rxjs-run/commit/21751cb))



<a name="4.0.0"></a>
# 4.0.0 (2017-02-22)

**See the changelog for all the `rc` versions of v4.0.0.**



<a name="4.0.0-rc.6"></a>
# 4.0.0-rc.6 (2017-02-08)


### Bug Fixes

* **rxjs-run:** update cycle/run to 1.0.0-rc.9 ([7209814](https://github.com/cyclejs/cyclejs/tree/master/rxjs-run/commit/7209814))



<a name="4.0.0-rc.5"></a>
# 4.0.0-rc.5 (2017-02-03)


### Bug Fixes

* **rxjs-run:** update run to v1.0.0-rc.8 ([2877010](https://github.com/cyclejs/cyclejs/tree/master/rxjs-run/commit/2877010))



<a name="4.0.0-rc.3"></a>
# 4.0.0-rc.3 (2017-01-19)


### Bug Fixes

* **rxjs-run:** use run v1.0.0-rc.7 ([dab8bb5](https://github.com/cyclejs/cyclejs/tree/master/rxjs-run/commit/dab8bb5))



<a name="4.0.0-rc.2"></a>
# 4.0.0-rc.2 (2016-12-14)

* **rxjs-run:** use run rc6, where sinks are not adapted ([93af810](https://github.com/cyclejs/cyclejs/tree/master/rxjs-run/commit/93af810))

<a name="3.3.0"></a>
# 3.3.0 (2016-12-22)


### Bug Fixes

* **rxjs-run:** remove dependency on types/es6-promise ([e3d31ef](https://github.com/cyclejs/cyclejs/tree/master/packages/rxjs-run/commit/e3d31ef))



<a name="3.2.0"></a>
# 3.2.0 (2016-12-21)


### Bug Fixes

* **rxjs-run:** correctly depend on rxjs-adapter v3.1 ([b039cf4](https://github.com/cyclejs/cyclejs/tree/master/packages/rxjs-run/commit/b039cf4))



<a name="3.1.0"></a>
# 3.1.0 (2016-12-05)


### Bug Fixes

* **rxjs-run:** update dependency cycle/base to v4.2 ([976a182](https://github.com/cyclejs/cyclejs/tree/master/packages/rxjs-run/commit/976a182))



<a name="3.0.3"></a>
## 3.0.3 (2016-07-31)


### Bug Fixes

* **rxjs-run:** fix major versions of dependencies ([d568161](https://github.com/cyclejs/cyclejs/tree/master/packages/rxjs-run/commit/d568161))



<a name="3.0.2"></a>
## 3.0.2 (2016-07-16)



