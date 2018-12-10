## 22.3.0 (2018-12-10)

* fix(dom): add better typings for the hyperscript helpers ([e211037](https://github.com/cyclejs/cyclejs/commit/e211037))



## 22.2.0 (2018-12-10)

* fix(dom): support TypeScript's strict mode ([90645d6](https://github.com/cyclejs/cyclejs/commit/90645d6))



## 22.1.0 (2018-12-05)

* fix(dom): fix rxjs and most typings of makeDOMDriver (#862) ([f661cf5](https://github.com/cyclejs/cyclejs/commit/f661cf5)), closes [#862](https://github.com/cyclejs/cyclejs/issues/862) [#860](https://github.com/cyclejs/cyclejs/issues/860)
* chore(dom): remove zombie transposition use in tests ([aff1c9d](https://github.com/cyclejs/cyclejs/commit/aff1c9d))



## 22.0.0 (2018-10-17)

* fix(dom): support Typescript 3.1 ([8174c25](https://github.com/cyclejs/cyclejs/commit/8174c25))


### BREAKING CHANGE

* If you use JavaScript, there are no breaking changes. If you use
TypeScript, then you may have to change some imports, only if you are
using RxJS or Most.js. If you are using RxJS: change
`import {makeDOMDriver} from '@cycle/dom'` to
`import {makeDOMDriver} from '@cycle/dom/lib/cjs/rxjs'` and change
`import {DOMSource} from '@cycle/dom/rxjs-typings'` to
`import {DOMSource} from '@cycle/dom/lib/cjs/rxjs'`. If you are
using Most.js: change
`import {makeDOMDriver} from '@cycle/dom'` to
`import {makeDOMDriver} from '@cycle/dom/lib/cjs/most'` and change
`import {DOMSource} from '@cycle/dom/most-typings'` to
`import {DOMSource} from '@cycle/dom/lib/cjs/most'`.


## 21.1.0 (2018-09-04)

* fix(dom): update snabbdom ([4ae8f80](https://github.com/cyclejs/cyclejs/commit/4ae8f80)), closes [#747](https://github.com/cyclejs/cyclejs/issues/747)
* docs(dom): document browser support for v21 ([2412938](https://github.com/cyclejs/cyclejs/commit/2412938))
* test(dom): test against older browsers ([60788d1](https://github.com/cyclejs/cyclejs/commit/60788d1))



## 21.4.0 (2018-08-21)

* docs(dom): more release notes on the new driver ([b83f8d7](https://github.com/cyclejs/cyclejs/commit/b83f8d7))
* fix(dom): add polyfills for IE10 and Safari 8 ([4fae7e4](https://github.com/cyclejs/cyclejs/commit/4fae7e4))
* fix(dom): document the breaking changes in the new dom driver ([5937168](https://github.com/cyclejs/cyclejs/commit/5937168))
* fix(dom): EventDelegator shouldnt register duplicate event listeners ([3e2e1cc](https://github.com/cyclejs/cyclejs/commit/3e2e1cc))
* fix(dom): fix rxjs and most typings ([c19ffea](https://github.com/cyclejs/cyclejs/commit/c19ffea)), closes [#775](https://github.com/cyclejs/cyclejs/issues/775)
* test(dom): add Android to browserstack tests ([af6d6e6](https://github.com/cyclejs/cyclejs/commit/af6d6e6))
* test(dom): add test for #747 ([0982d67](https://github.com/cyclejs/cyclejs/commit/0982d67)), closes [#747](https://github.com/cyclejs/cyclejs/issues/747)
* test(dom): add test for sibling isolation with className prop ([4a46cd4](https://github.com/cyclejs/cyclejs/commit/4a46cd4))
* test(dom): fix dom tests ([160cc89](https://github.com/cyclejs/cyclejs/commit/160cc89))
* test(dom): remove old and unused tests ([b169d64](https://github.com/cyclejs/cyclejs/commit/b169d64))
* refactor(dom): abort bubbling if elements are not in the DOM any more ([244f239](https://github.com/cyclejs/cyclejs/commit/244f239))
* refactor(dom): add remote BrowserStack tests ([9c44022](https://github.com/cyclejs/cyclejs/commit/9c44022)), closes [#803](https://github.com/cyclejs/cyclejs/issues/803)
* refactor(dom): fix remapping of coverage reports ([a261457](https://github.com/cyclejs/cyclejs/commit/a261457))
* refactor(dom): improve bubbling algorithm ([0a33539](https://github.com/cyclejs/cyclejs/commit/0a33539))
* refactor(dom): improve handling of domListenersToAdd ([4afb985](https://github.com/cyclejs/cyclejs/commit/4afb985))
* refactor(dom): move DOM tests to karma ([88d226d](https://github.com/cyclejs/cyclejs/commit/88d226d))
* refactor(dom): rewrite DOM driver to fix isolation ([34a5e6d](https://github.com/cyclejs/cyclejs/commit/34a5e6d))
* refactor(dom): use Array<T> not T[], for consistency ([d7edf9e](https://github.com/cyclejs/cyclejs/commit/d7edf9e))


### BREAKING CHANGE

* The dom driver now uses syntetic event bubbling and the isolation semantics changed slightly, see
https://cycle.js.org/releases.html for more information


<a name="20.4.0"></a>
# 20.4.0 (2018-05-04)


### Bug Fixes

* **dom:** postpone sampling of root element until DOM is ready. ([9653d98](https://github.com/cyclejs/cyclejs/commit/9653d98))



<a name="20.3.0"></a>
# 20.3.0 (2018-05-01)


### Bug Fixes

* **dom:** update snabbdom-selector ([b345417](https://github.com/cyclejs/cyclejs/commit/b345417))


### Features

* **dom:** add support for HTML5 `<details>` and `<summary>` tags to HyperscriptHelpers ([cf3cc81](https://github.com/cyclejs/cyclejs/commit/cf3cc81))



<a name="20.2.0"></a>
# 20.2.0 (2018-02-22)


### Bug Fixes

* **dom:** fix .elements() support for rxjs and most ([1239822](https://github.com/cyclejs/cyclejs/commit/1239822))



<a name="20.1.0"></a>
# 20.1.0 (2017-11-11)


### Bug Fixes

* **dom:** fix race condition between DOM ready and cycle/run replication ([9fcec3c](https://github.com/cyclejs/cyclejs/commit/9fcec3c))



<a name="20.0.0"></a>
# 20.0.0 (2017-11-10)


### Bug Fixes

* **dom:** use MutationObserver to avoid mutation loop ([a349b20](https://github.com/cyclejs/cyclejs/commit/a349b20))


### BREAKING CHANGES

* **dom:** Internet Explorer 10 is no longer officially supported, but it can still
be used with cycle/dom under some circumstances. You should use a
polyfill for MutationObserver and make sure you are not rendering the
application in a DocumentFragment as the container node. Only under
those conditions will cycle/dom should work correctly in IE10.

ISSUES CLOSED: #699



<a name="19.3.0"></a>
# 19.3.0 (2017-10-26)


### Bug Fixes

* **dom:** correct the TypeScript signature of DOMSource.element() ([a201abd](https://github.com/cyclejs/cyclejs/commit/a201abd))
* **dom:** upgrade snabbdom-selector dependency to 2.0.1 ([7af2b19](https://github.com/cyclejs/cyclejs/commit/7af2b19))



<a name="19.2.0"></a>
# 19.2.0 (2017-10-24)



<a name="19.1.0"></a>
# 19.1.0 (2017-10-24)



<a name="19.0.0"></a>
# 19.0.0 (2017-10-19)


### Bug Fixes

* **dom:** remove "change" from eventTypesThatDontBubble (#690) ([a1600d0](https://github.com/cyclejs/cyclejs/commit/a1600d0))


### Features

* **dom:** allow predicate function or object as preventDefault ([e66a534](https://github.com/cyclejs/cyclejs/commit/e66a534))
* **dom:** DOMSource.elements() always returns arrays ([0501189](https://github.com/cyclejs/cyclejs/commit/0501189))
* **dom:** overload .event() method using HTMLElementEventMap (#682) ([b9db15c](https://github.com/cyclejs/cyclejs/commit/b9db15c))


### BREAKING CHANGES

* **dom:** `select('document').elements()` now always returns
`Stream<Array<Document>>`
`select('body').elements()` now always returns
`Stream<Array<HTMLBodyElement>>`
`select(everythingElse).elements()` now always returns `Stream<Array<Element>>`
We also introduced `.element()` (notice in the singular, not plural)
which will always return a non-array, either `Stream<Document>` or
`Stream<HTMLBodyElement>` or `Stream<Element>`.

ISSUES CLOSED: #677
* **dom:** It's probable your app will not break when updating cycle/dom. However,
if you are using `domSource.events('change')` and unknowingly relying on
buggy behavior of this library, your app might behave differently. So
upgrade carefully if you have that use case, otherwise this version is
very safe to upgrade to, since this bug fix is so tiny.



<a name="18.3.0"></a>
# 18.3.0 (2017-09-05)


### Bug Fixes

* **dom:** wait for snabbdom's post hook to clean vnodes (#667) ([dd5712f](https://github.com/cyclejs/cyclejs/commit/dd5712f))


### Performance Improvements

* **dom:** use for loop instead of forEach+bind in IsolateModule ([70a4521](https://github.com/cyclejs/cyclejs/commit/70a4521))



<a name="18.2.0"></a>
# 18.2.0 (2017-08-29)


### Bug Fixes

* **dom:** add TypeScript typings for es6-map polyfill ([805aa6d](https://github.com/cyclejs/cyclejs/commit/805aa6d))
* **dom:** switch from require() to import statements for es6 map polyfill ([f459ada](https://github.com/cyclejs/cyclejs/commit/f459ada))



<a name="18.1.0"></a>
# 18.1.0 (2017-08-11)


### Bug Fixes

* **dom:** update snabbdom to v0.7.0 ([506bf88](https://github.com/cyclejs/cyclejs/commit/506bf88))
* **dom:** wrap svg example width and height attrs inside attrs object (#653) ([832f567](https://github.com/cyclejs/cyclejs/commit/832f567))


### BREAKING CHANGES

* **dom:** Snabbdom 0.7.0 has some breaking changes, see their release notes:
https://github.com/snabbdom/snabbdom/releases/tag/v0.7.0

ISSUES CLOSED: #656



<a name="18.0.0"></a>
# 18.0.0 (2017-07-20)


### Bug Fixes

* **dom:** revert patchEvent optimization, to support IE10+ ([2e78ee0](https://github.com/cyclejs/cyclejs/commit/2e78ee0))
* **dom:** update to TypeScript v2.4 ([e72283b](https://github.com/cyclejs/cyclejs/commit/e72283b))


### BREAKING CHANGES

* **dom:** If you are a JavaScript user, there are no breaking changes. If you are a TypeScript user, this
version has breaking changes due to TypeScript v2.4 update. Update and recompile carefully.

ISSUES CLOSED: #640



<a name="17.6.0"></a>
# 17.6.0 (2017-07-08)


### Bug Fixes

* **dom:** allow using isolated DOMSource.events() ([8de1a78](https://github.com/cyclejs/cyclejs/commit/8de1a78))


### Performance Improvements

* **dom:** avoid an allocation in EventDelegator.patchEvent ([0153cea](https://github.com/cyclejs/cyclejs/commit/0153cea))



<a name="17.5.0"></a>
# 17.5.0 (2017-06-28)


### Bug Fixes

* **dom:** add support for "time" hyperscript-helper ([550d83f](https://github.com/cyclejs/cyclejs/commit/550d83f))



<a name="17.4.0"></a>
# 17.4.0 (2017-05-29)


### Bug Fixes

* **dom:** update to snabbdom 0.6.9 ([22d5cf0](https://github.com/cyclejs/cyclejs/commit/22d5cf0)), closes [#612](https://github.com/cyclejs/cyclejs/issues/612)



<a name="17.3.0"></a>
# 17.3.0 (2017-05-16)


### Bug Fixes

* **dom:** thunk() supports isolation ([ea50dc5](https://github.com/cyclejs/cyclejs/commit/ea50dc5))
* **dom:** update snabbdom to v0.6.8 ([4c11676](https://github.com/cyclejs/cyclejs/commit/4c11676))


### Features

* **dom:** update snabbdom to 0.6.7, snabbdom-selector to 1.2 ([3fc528b](https://github.com/cyclejs/cyclejs/commit/3fc528b))



<a name="17.2.0"></a>
# 17.2.0 (2017-05-15)


### Features

* **dom:** add preventDefault option ([5d829a8](https://github.com/cyclejs/cyclejs/commit/5d829a8))


### Performance Improvements

* **dom:** avoid an object allocation in MainDOMSource ([fc218cf](https://github.com/cyclejs/cyclejs/commit/fc218cf))



<a name="17.1.0"></a>
# 17.1.0 (2017-03-28)


### Bug Fixes

* **dom:** support null and undefined isolated DOM sinks ([98af6fb](https://github.com/cyclejs/cyclejs/commit/98af6fb))



<a name="17.0.0"></a>
# 17.0.0 (2017-03-25)


### Bug Fixes

* **dom:** remove HTML driver from Cycle DOM ([8a5aac7](https://github.com/cyclejs/cyclejs/commit/8a5aac7))


### BREAKING CHANGES

* **dom:** We extracted the HTML driver to its own package, under Cycle HTML. It still depends on Cycle DOM and
does the same as before, but lives under a different package. This extraction benefits you to reduce
the bundle size client-side, since the HTML driver is usually not used client-side.



<a name="16.0.0"></a>
# 16.0.0 (2017-03-08)


### Features

* **dom:** allow choosing no isolation or sibling isolation ([13cb6bc](https://github.com/cyclejs/cyclejs/commit/13cb6bc))


### BREAKING CHANGES

* dom: Rare breaking change that will likely NOT affect you: we are giving special meaning to some scope
strings given to isolation. Before, every string given as isolation scope would mean total
isolation. Now, the string ':root' means no isolation and strings starting with '.' or '#' mean
sibling-sibling isolation. This is a technically a breaking change in case you happened to use
strings like that as isolation scopes (which is unlikely). But otherwise, this is safe to update
without migration.

ISSUES CLOSED: 526



<a name="15.2.0"></a>
# 15.2.0 (2017-02-25)


### Bug Fixes

* **dom:** update snabbdom to v0.6.5, which solves some bugs ([0ab2f52](https://github.com/cyclejs/cyclejs/commit/0ab2f52))



<a name="15.1.0"></a>
# 15.1.0 (2017-02-24)


### Bug Fixes

* **dom:** fix issue 531 ([539a196](https://github.com/cyclejs/cyclejs/commit/539a196))



<a name="15.0.0"></a>
# 15.0.0 (2017-02-22)

**See the changelog for all the `rc` versions of v15.0.0.**


<a name="15.0.0-rc.4"></a>
# 15.0.0-rc.4 (2017-02-09)



<a name="15.0.0-rc.3"></a>
# 15.0.0-rc.3 (2017-02-09)


### Bug Fixes

* **dom:** fix client-side rendering to consider existing DOM ([760e1f3](https://github.com/cyclejs/cyclejs/commit/760e1f3))
* **dom:** fix isolation bug of child when parent is re-added ([e18e7f7](https://github.com/cyclejs/cyclejs/commit/e18e7f7))
* **dom:** make cycle/run a hard dependency ([47f7f49](https://github.com/cyclejs/cyclejs/commit/47f7f49))
* **dom:** report errors thrown in snabbdom hooks ([edb025c](https://github.com/cyclejs/cyclejs/commit/edb025c))
* **dom:** rewrite for Cycle Unified ([47346b4](https://github.com/cyclejs/cyclejs/commit/47346b4))
* **dom:** start snabbdom only when DOM is ready ([40d39dd](https://github.com/cyclejs/cyclejs/commit/40d39dd))
* **dom:** support using DOMSource.elements() in isolated main() ([ca192b5](https://github.com/cyclejs/cyclejs/commit/ca192b5))
* **dom:** update snabbdom to v0.6.4 ([f6dd895](https://github.com/cyclejs/cyclejs/commit/f6dd895))
* **dom:** update to snabbdom v0.6.3 ([d1077c8](https://github.com/cyclejs/cyclejs/commit/d1077c8))


### Features

* **dom:** support passing custom modules to HTML driver ([f965de5](https://github.com/cyclejs/cyclejs/commit/f965de5))
* **dom:** use snabbdom dataset module by default ([36759af](https://github.com/cyclejs/cyclejs/commit/36759af))



<a name="15.0.0-rc.2"></a>
# 15.0.0-rc.2 (2017-02-03)


### Bug Fixes

* **dom:** fix isolation bug of child when parent is re-added ([e18e7f7](https://github.com/cyclejs/cyclejs/commit/e18e7f7))
* **dom:** make cycle/run a hard dependency ([47f7f49](https://github.com/cyclejs/cyclejs/commit/47f7f49))
* **dom:** report errors thrown in snabbdom hooks ([edb025c](https://github.com/cyclejs/cyclejs/commit/edb025c))
* **dom:** rewrite for Cycle Unified ([47346b4](https://github.com/cyclejs/cyclejs/commit/47346b4))
* **dom:** start snabbdom only when DOM is ready ([40d39dd](https://github.com/cyclejs/cyclejs/commit/40d39dd))
* **dom:** support using DOMSource.elements() in isolated main() ([ca192b5](https://github.com/cyclejs/cyclejs/commit/ca192b5))
* **dom:** update to snabbdom v0.6.3 ([d1077c8](https://github.com/cyclejs/cyclejs/commit/d1077c8))


### Features

* **dom:** support passing custom modules to HTML driver ([f965de5](https://github.com/cyclejs/cyclejs/commit/f965de5))
* **dom:** use snabbdom dataset module by default ([36759af](https://github.com/cyclejs/cyclejs/commit/36759af))



<a name="14.3.0"></a>
# 14.3.0 (2016-12-21)



<a name="14.2.0"></a>
# 14.2.0 (2016-12-07)


### Bug Fixes

* **dom:** change EventDelegator bubble to search topElement ([ae5113e](https://github.com/cyclejs/cyclejs/commit/ae5113e))



<a name="14.1.0"></a>
# 14.1.0 (2016-11-16)


### Bug Fixes

* **dom:** skip calling addNS on svg "text" children ([faf52d4](https://github.com/cyclejs/cyclejs/commit/faf52d4))



<a name="14.0.0"></a>
# 14.0.0 (2016-10-30)


### Bug Fixes

* **dom:** allow same isolate scope for parent and child ([54dbdfe](https://github.com/cyclejs/cyclejs/commit/54dbdfe))


### BREAKING CHANGES

* dom: ![probably won't](https://img.shields.io/badge/will%20it%20affect%20me%3F-probably%20won't-green.svg)
Snabbdom vnode.data.isolate content is no longer prefixed with `$$CYCLEDOM$$-`. This is an API almost
no one uses or depends on, so should be very safe to upgrade to this version.

ISSUES CLOSED: #453



<a name="13.0.0"></a>
# 13.0.0 (2016-10-14)


### Bug Fixes

* **dom:** fix stream libraries DOMSource.elements typings ([a30f5cb](https://github.com/cyclejs/cyclejs/commit/a30f5cb))


### BREAKING CHANGES

* dom: The TypeScript signature for DOMSource.elements() has changed its return type
from `Stream<Element>` (incorrect) to `Stream<Element | Array<Element>>` (correct).
This is a tiny breaking that only affects TypeScript users who are using
`domSource.elements()`. Safe to update if you are not using TypeScript nor
`elements()` method.

ISSUES CLOSED: #451



<a name="12.2.8"></a>
## 12.2.8 (2016-10-14)


### Bug Fixes

* **dom:** enable restarting of event streams on isolated components ([08265db](https://github.com/cyclejs/cyclejs/commit/08265db))



<a name="12.2.7"></a>
## 12.2.7 (2016-10-13)



<a name="12.2.6"></a>
## 12.2.6 (2016-10-12)


### Bug Fixes

* **dom:** add virtual DOM sanitation on `dispose()` (#442) ([c91e7c6](https://github.com/cyclejs/cyclejs/commit/c91e7c6)), closes [#263](https://github.com/cyclejs/cyclejs/issues/263)



<a name="12.2.5"></a>
## 12.2.5 (2016-09-13)


### Bug Fixes

* **dom:** retain event streams when isolated parent is recreated ([5b37dd0](https://github.com/cyclejs/cyclejs/commit/5b37dd0))



<a name="12.2.4"></a>
## 12.2.4 (2016-09-04)


### Bug Fixes

* **dom:** fix small obstacle to using web components ([a74551c](https://github.com/cyclejs/cyclejs/commit/a74551c))



<a name="12.2.3"></a>
## 12.2.3 (2016-09-02)


### Bug Fixes

* **dom:** small refactor, safe to upgrade ([2e3de51](https://github.com/cyclejs/cyclejs/commit/2e3de51))



<a name="12.2.2"></a>
## 12.2.2 (2016-08-25)


### Bug Fixes

* **dom:** slightly faster IsolateModule ([0126d2e](https://github.com/cyclejs/cyclejs/commit/0126d2e))



<a name="12.2.1"></a>
## 12.2.1 (2016-08-21)


### Bug Fixes

* **dom:** use a fixed major version of xstream-adapter ([549180b](https://github.com/cyclejs/cyclejs/commit/549180b))



<a name="12.2.0"></a>
# 12.2.0 (2016-08-21)


### Features

* **dom:** support the Chrome DevTool to distinguish source streams ([053718c](https://github.com/cyclejs/cyclejs/commit/053718c))



<a name="12.1.0"></a>
# 12.1.0 (2016-08-14)


### Features

* **dom:** add support for selecting `document` and `body` ([93bd3c4](https://github.com/cyclejs/cyclejs/commit/93bd3c4))



<a name="12.0.3"></a>
## 12.0.3 (2016-08-01)


### Bug Fixes

* **dom:** fix support for SVG polyline ([d0eb12c](https://github.com/cyclejs/cyclejs/commit/d0eb12c))



<a name="12.0.2"></a>
## 12.0.2 (2016-07-31)


### Performance Improvements

* **dom:** clear out delegator destinations for stopped streams ([a9268e0](https://github.com/cyclejs/cyclejs/commit/a9268e0))



<a name="12.0.1"></a>
## 12.0.1 (2016-07-31)


### Bug Fixes

* **dom:** use isolation scope as snabbdom key ([b763d25](https://github.com/cyclejs/cyclejs/commit/b763d25))



<a name="12.0.0"></a>
# 12.0.0 (2016-07-29)


### Features

* **dom:** html driver supports multiple emissions ([c02dfe8](https://github.com/cyclejs/cyclejs/commit/c02dfe8))


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

* **dom:** use snabbdom exactly 0.5.0 as a fixed version ([642bd6c](https://github.com/cyclejs/cyclejs/commit/642bd6c))



<a name="11.0.0"></a>
# 11.0.0 (2016-07-21)


### Bug Fixes

* **dom:** update Snabbdom to v0.5.0 ([6ec38f0](https://github.com/cyclejs/cyclejs/commit/6ec38f0))


### BREAKING CHANGES

* dom: Thunk API changed. Particularly, it now takes a key argument (2nd parameter) and the stateArguments
parameter (4th parameter) must always be an array.

ISSUES CLOSED: #351.



