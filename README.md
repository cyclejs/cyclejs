<h1 align="center">Cycle.js</h1>

<div align="center">
  <img alt="logo" src="https://raw.githubusercontent.com/cyclejs/cyclejs/master/logo.png" width="128">
</div>
<div align="center">
  <strong>A functional and reactive JavaScript framework for cleaner code</strong>
</div>
<div align="center">
  <!-- Build Status -->
  <a href="https://travis-ci.org/cyclejs/cyclejs">
    <img src="https://img.shields.io/travis/cyclejs/cyclejs/master.svg?style=flat-square"
      alt="Build Status" />
  </a>
  <br />
  <!-- JS.ORG -->
  <a href="http://cycle.js.org/">
    <img src="https://img.shields.io/badge/js.org-cycle-ffb400.svg?style=flat-square"
      alt="JS.ORG" />
  </a>
</div>

<div align="center">
  <h3>
    <a href="http://cycle.js.org">
      Website
    </a>
    <span> | </span>
      Packages
    <span> | </span>
    <a href="https://github.com/cyclejs/cyclejs/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22">
      Contribute
    </a>
    <span> | </span>
    <a href="https://gitter.im/cyclejs/cyclejs">
      Chat
    </a>
  </h3>
</div>

## Welcome

| Question | Answer |
|--------|-------|
| "I want to learn Cycle.js" | [Read the official documentation](http://cycle.js.org) |
| "I have a question" | [Join the chat](https://gitter.im/cyclejs/cyclejs)<br />Or<br />[Create a StackOverflow question](http://stackoverflow.com/questions/tagged/cyclejs)<br />Or<br />[Open an issue](https://github.com/cyclejs/cyclejs/issues/new) <br /><sub>Please note all discussion-like issues are labeled discussion and immediately closed. This doesn't mean we unconsidered your discussion. We only leave actual issues open.</sub> |
| "I found a bug" | [Open an issue](https://github.com/cyclejs/cyclejs/issues/new) |
| "I want to help build Cycle.js" | [Read the Contributing guides](https://github.com/cyclejs/cyclejs/blob/master/CONTRIBUTING.md)<br />Then<br />[Choose an issue marked "help wanted"](https://github.com/cyclejs/cyclejs/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) |

## Packages

Cycle.js is comprised of many specialized packages. This repository contains all these packages, e.g., the npm package `@cycle/base` lives in the directory `base`. Below you will find a summary of each package.

| Package | Version | Dependencies | DevDependencies |
|--------|-------|------------|----------|
| `@cycle/base` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/base.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=base)](https://david-dm.org/cyclejs/cyclejs?path=base) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=base)](https://david-dm.org/cyclejs/cyclejs?path=base#info=devDependencies) |
| `@cycle/dom` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/dom.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=dom)](https://david-dm.org/cyclejs/cyclejs?path=dom) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=dom)](https://david-dm.org/cyclejs/cyclejs?path=dom#info=devDependencies) |
| `@cycle/http` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/http.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=http)](https://david-dm.org/cyclejs/cyclejs?path=http) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=http)](https://david-dm.org/cyclejs/cyclejs?path=http#info=devDependencies) |
| `@cycle/isolate` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/isolate.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=isolate)](https://david-dm.org/cyclejs/cyclejs?path=isolate) |  [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=isolate)](https://david-dm.org/cyclejs/cyclejs?path=isolate#info=devDependencies) |
| `@cycle/jsonp` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/jsonp.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=jsonp)](https://david-dm.org/cyclejs/cyclejs?path=jsonp) |  [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=jsonp)](https://david-dm.org/cyclejs/cyclejs?path=jsonp#info=devDependencies) |
| `@cycle/most-adapter` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/most-adapter.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=most-adapter)](https://david-dm.org/cyclejs/cyclejs?path=most-adapter) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=most-adapter)](https://david-dm.org/cyclejs/cyclejs?path=most-adapter#info=devDependencies) |
| `@cycle/most-run` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/most-run.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=most-run)](https://david-dm.org/cyclejs/cyclejs?path=most-run) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=most-run)](https://david-dm.org/cyclejs/cyclejs?path=most-run#info=devDependencies) |
| `@cycle/rx-adapter` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/rx-adapter.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=rx-adapter)](https://david-dm.org/cyclejs/cyclejs?path=rx-adapter) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=rx-adapter)](https://david-dm.org/cyclejs/cyclejs?path=rx-adapter#info=devDependencies) |
| `@cycle/rx-run` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/rx-run.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=rx-run)](https://david-dm.org/cyclejs/cyclejs?path=rx-run) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=rx-run)](https://david-dm.org/cyclejs/cyclejs?path=rx-run#info=devDependencies) |
| `@cycle/rxjs-adapter` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/rxjs-adapter.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=rxjs-adapter)](https://david-dm.org/cyclejs/cyclejs?path=rxjs-adapter) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=rxjs-adapter)](https://david-dm.org/cyclejs/cyclejs?path=rxjs-adapter#info=devDependencies) |
| `@cycle/rxjs-run` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/rxjs-run.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=rxjs-run)](https://david-dm.org/cyclejs/cyclejs?path=rxjs-run) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=rxjs-run)](https://david-dm.org/cyclejs/cyclejs?path=rxjs-run#info=devDependencies) |
| `@cycle/xstream-adapter` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/xstream-adapter.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=xstream-adapter)](https://david-dm.org/cyclejs/cyclejs?path=xstream-adapter) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=xstream-adapter)](https://david-dm.org/cyclejs/cyclejs?path=xstream-adapter#info=devDependencies) |
| `@cycle/xstream-run` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/xstream-run.svg?maxAge=2592000)]() | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=xstream-run)](https://david-dm.org/cyclejs/cyclejs?path=xstream-run) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=xstream-run)](https://david-dm.org/cyclejs/cyclejs?path=xstream-run#info=devDependencies) |

### Stream libraries

The following packages are not under Cycle.js, but are important dependencies, so we display their latest versions for convenience.

| Package | Version |
|--------|-------|
| `most` | [![npm version](https://img.shields.io/npm/v/most.svg?maxAge=2592000)](https://www.npmjs.com/package/most) |
| `rx` | [![npm version](https://img.shields.io/npm/v/rx.svg?maxAge=2592000)](https://www.npmjs.com/package/rx) |
| `rxjs` | [![npm version](https://img.shields.io/npm/v/rxjs.svg?maxAge=2592000)](https://www.npmjs.com/package/rxjs) |
| `xstream` | [![npm version](https://img.shields.io/npm/v/xstream.svg?maxAge=2592000)](https://www.npmjs.com/package/xstream) |

## LICENSE

[The MIT License](https://github.com/cyclejs/cyclejs/blob/master/LICENSE)
