<a name="3.1.0"></a>
# 3.1.0 (2017-03-24)


### Features

* **run:** sinks to support TypeScript interface  ([c59ec55](https://github.com/cyclejs/cyclejs/commit/c59ec55))



<a name="3.0.0"></a>
# 3.0.0 (2017-03-05)


### Bug Fixes

* **run:** check for matching stream types of sinks and drivers ([4b4094c](https://github.com/cyclejs/cyclejs/commit/4b4094c))
* **run:** reintroduce Driver function TS type ([1ad62cb](https://github.com/cyclejs/cyclejs/commit/1ad62cb))


### BREAKING CHANGES

* run: If you are using JavaScript, literally nothing changes. If you are using TypeScript, this version
may detect more errors than before, and may break (by not compiling) your existing code if your
existing code happened to have a sneaky bug.

ISSUES CLOSED: 541



<a name="2.0.0"></a>
# 2.0.0 (2017-03-05)


### Bug Fixes

* **run:** type check keyof drivers and main with TypeScript 2.2 ([da528c7](https://github.com/cyclejs/cyclejs/commit/da528c7))


### BREAKING CHANGES

* run: If you are using JavaScript, literally nothing has changed, and this is not a breaking release.
However, if you are using TypeScript, this version may catch errors and typos that previous Cycle
Run versions didnt. Also, this version expects that if Sinks of main() are typed, they must be a
type alias, not an interface. Usually you should leave the Sinks object implicitly typed, but we
also support type aliases if you want to explicitly type them.

ISSUES CLOSED: 538



<a name="1.0.0"></a>
# 1.0.0 (2017-02-22)

First stable version of this package.


<a name="1.0.0-rc.9"></a>
# 1.0.0-rc.9 (2017-02-08)


### Bug Fixes

* **run:** fix race condition for drivers that subscribe late ([58b7991](https://github.com/cyclejs/cyclejs/commit/58b7991))
* **run:** sink proxy completes on dispose, not with setTimeout ([47931fc](https://github.com/cyclejs/cyclejs/commit/47931fc))


### BREAKING CHANGES

* run: if you are using sources or sinks from the output of
Cycle setup(), you may see different behavior of the complete
notification, which now happens always when run's dispose() is called.
The complete notifications from main's sinks are ignored.



<a name="1.0.0-rc.8"></a>
# 1.0.0-rc.8 (2017-02-03)


### Bug Fixes

* **run:** fix race condition for drivers that subscribe late ([58b7991](https://github.com/cyclejs/cyclejs/commit/58b7991))



<a name="1.0.0-rc.7"></a>
# 1.0.0-rc.7 (2017-01-19)


### Bug Fixes

* **run:** support drivers that dont return sources ([cda7602](https://github.com/cyclejs/cyclejs/commit/cda7602))



<a name="1.0.0-rc.6"></a>
# 1.0.0-rc.6 (2016-12-14)


### Bug Fixes

* **run:** adapt() sources, do not adapt() sinks ([0fd15ed](https://github.com/cyclejs/cyclejs/commit/0fd15ed))



<a name="1.0.0-rc.5"></a>
# 1.0.0-rc.5 (2016-12-12)


### Bug Fixes

* **run:** update to TypeScript 2.1 ([b7cabbc](https://github.com/cyclejs/cyclejs/commit/b7cabbc))



<a name="1.0.0-rc.4"></a>
# 1.0.0-rc.4 (2016-12-09)


### Bug Fixes

* **run:** clear buffers after all sink replicators are mutated ([432e4a6](https://github.com/cyclejs/cyclejs/commit/432e4a6))



<a name="1.0.0-rc.3"></a>
# 1.0.0-rc.3 (2016-12-09)


### Bug Fixes

* **run:** adapt sink to target stream lib before calling driver ([5edd925](https://github.com/cyclejs/cyclejs/commit/5edd925))
* **run:** only free up buffers after replicator has been mutated ([bf8a7e1](https://github.com/cyclejs/cyclejs/commit/bf8a7e1))



<a name="1.0.0-rc.2"></a>
# 1.0.0-rc.2 (2016-12-09)


### Bug Fixes

* **run:** use FantasyObservable in Sinks, not xstream Stream ([d68a50e](https://github.com/cyclejs/cyclejs/commit/d68a50e))



<a name="1.0.0-rc.1"></a>
# 1.0.0-rc.1 (2016-12-09)



