## 5.2.0 (2019-11-06)




## 5.1.0 (2019-09-10)




## 5.0.0 (2019-02-03)

* fix(isolate): use TypeScript unknown to force casting types ([ff698ce](https://github.com/cyclejs/cyclejs/commit/ff698ce))


### BREAKING CHANGE

* If you use JavaScript, there are no breaking changes. If you use
TypeScript, then from now onwards isolate() returns sink types that are
never type "any", but instead returns "unknown". Often it may infer the
correct type, but when it cannot infer the type, it will return
"unknown" which means you are forced to type cast it to the correct
type. This is better than "any", because "any" is like JavaScript and
gives little type safety.


## 4.2.0 (2018-12-10)

* fix(isolate): support TypeScript's strict mode ([c8aee41](https://github.com/cyclejs/cyclejs/commit/c8aee41))



## 4.1.0 (2018-10-17)

* fix(isolate): support TypeScript 3.1 ([3e847bb](https://github.com/cyclejs/cyclejs/commit/3e847bb))
* refactor(isolate): move isolate tooling to pnpm ([6aea3e7](https://github.com/cyclejs/cyclejs/commit/6aea3e7))


### BREAKING CHANGE

* If you use JavaScript, there are no breaking changes. If you use
TypeScript, this package may not work anymore with versions of TS below
3.1.


## 4.0.0 (2018-09-26)




<a name="3.4.0"></a>
# 3.4.0 (2018-07-17)


### Bug Fixes

* **isolate:** adapt sinks so xstream semantics can be applied ([77ae9d0](https://github.com/cyclejs/cyclejs/commit/77ae9d0))


### BREAKING CHANGES

* **isolate:** This update changes the contract such that xstream and @cycle/run are now dependencies.

ISSUES CLOSED: #826



<a name="3.3.0"></a>
# 3.3.0 (2018-04-19)


### Features

* **isolate:** add \`toIsolated\` returning a higher order component ([fe1efb3](https://github.com/cyclejs/cyclejs/commit/fe1efb3))



<a name="3.2.0"></a>
# 3.2.0 (2017-10-24)



<a name="3.1.0"></a>
# 3.1.0 (2017-08-12)



<a name="3.0.0"></a>
# 3.0.0 (2017-06-20)


### Features

* **isolate:** support null scope to disable isolation ([2427d76](https://github.com/cyclejs/cyclejs/commit/2427d76))


### BREAKING CHANGES

* **isolate:** This is a breaking change only in case you utilized null scopes to perform isolation. Previously
null scope would enable isolation using null as the isolation name, and now null scope will just
disable isolation. It would be quite a corner case to rely on null scopes, so this will breaking
change likely not affect your project, and this new version of isolate is rather safe to upgrade.



<a name="2.1.0"></a>
# 2.1.0 (2017-03-08)


### Features

* **isolate:** allow a scopes-per-channel object as second arg ([e35b731](https://github.com/cyclejs/cyclejs/commit/e35b731))



<a name="2.0.0"></a>
# 2.0.0 (2017-02-22)

**See the changelog for all the `rc` versions of v2.0.0.**


<a name="2.0.0-rc.2"></a>
# 2.0.0-rc.2 (2017-02-08)


### Bug Fixes

* **isolate:** fix typings for isolate, accepts any sources ([ccd5ec1](https://github.com/cyclejs/cyclejs/commit/ccd5ec1))
* **isolate:** update codebase to use TypeScript 2.1 ([0ec0980](https://github.com/cyclejs/cyclejs/commit/0ec0980))


### BREAKING CHANGES

* isolate: If you use JavaScript, this will not be a breaking change. If you use TypeScript 2.0, this is a
* isolate: as we are using exclusive TypeScript 2.1 features, only supported in v2.1.



<a name="2.0.0-rc.1"></a>
# 2.0.0-rc.1 (2017-02-03)


### Bug Fixes

* **isolate:** update codebase to use TypeScript 2.1 ([0ec0980](https://github.com/cyclejs/cyclejs/commit/0ec0980))


### BREAKING CHANGES

* isolate: If you use JavaScript, this will not be a breaking change. If you use TypeScript 2.0, this is a
* isolate: as we are using exclusive TypeScript 2.1 features, only supported in v2.1.



<a name="1.4.0"></a>
# 1.4.0 (2016-07-16)



