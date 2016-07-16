<h1 align="center">Cycle.js</h1>

<div align="center">
  <img alt="babel" src="https://raw.githubusercontent.com/cyclejs/monorepo/master/logo.png" width="128">
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
  <!-- JS.ORG -->
  <a href="http://js.org">
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

Cycle.js is comprised of many specialized packages. This repository contains all these packages, e.g., the npm package `@cycle/foo` lives in the directory `foo`. Below you will find a summary of each package.

| Package | Version | Dependencies | DevDependencies |
|--------|-------|------------|----------|
| `@cycle/base` | [![npm version](https://badge.fury.io/js/%40cycle%2Fbase.svg)](http://badge.fury.io/js/%40cycle%2Fbase) | [![Dependency Status](https://david-dm.org/cyclejs/base.svg)](https://david-dm.org/cyclejs/base) | [![devDependency Status](https://david-dm.org/cyclejs/base/dev-status.svg)](https://david-dm.org/cyclejs/base#info=devDependencies) |
| `@cycle/dom` | [![npm version](https://badge.fury.io/js/%40cycle%2Fdom.svg)](http://badge.fury.io/js/%40cycle%2Fdom) | [![Dependency Status](https://david-dm.org/cyclejs/dom.svg)](https://david-dm.org/cyclejs/dom) | [![devDependency Status](https://david-dm.org/cyclejs/dom/dev-status.svg)](https://david-dm.org/cyclejs/dom#info=devDependencies) |
| `@cycle/http` | [![npm version](https://badge.fury.io/js/%40cycle%2Fhttp.svg)](http://badge.fury.io/js/%40cycle%2Fhttp) | [![Dependency Status](https://david-dm.org/cyclejs/http.svg)](https://david-dm.org/cyclejs/http) | [![devDependency Status](https://david-dm.org/cyclejs/http/dev-status.svg)](https://david-dm.org/cyclejs/http#info=devDependencies) |
| `@cycle/isolate` | [![npm version](https://badge.fury.io/js/%40cycle%2Fisolate.svg)](http://badge.fury.io/js/%40cycle%2Fisolate) | [![Dependency Status](https://david-dm.org/cyclejs/isolate.svg)](https://david-dm.org/cyclejs/isolate) |  [![devDependency Status](https://david-dm.org/cyclejs/isolate/dev-status.svg)](https://david-dm.org/cyclejs/isolate#info=devDependencies) |
| `@cycle/jsonp` | [![npm version](https://badge.fury.io/js/%40cycle%2Fjsonp.svg)](http://badge.fury.io/js/%40cycle%2Fjsonp) | [![Dependency Status](https://david-dm.org/cyclejs/jsonp.svg)](https://david-dm.org/cyclejs/jsonp) |  [![devDependency Status](https://david-dm.org/cyclejs/jsonp/dev-status.svg)](https://david-dm.org/cyclejs/jsonp#info=devDependencies) |
| `@cycle/most-adapter` | [![npm version](https://badge.fury.io/js/%40cycle%2Fmost-adapter.svg)](http://badge.fury.io/js/%40cycle%2Fmost-adapter) | [![Dependency Status](https://david-dm.org/cyclejs/most-adapter.svg)](https://david-dm.org/cyclejs/most-adapter) | [![devDependency Status](https://david-dm.org/cyclejs/most-adapter/dev-status.svg)](https://david-dm.org/cyclejs/most-adapter#info=devDependencies) |
| `@cycle/most-run` | [![npm version](https://badge.fury.io/js/%40cycle%2Fmost-run.svg)](http://badge.fury.io/js/%40cycle%2Fmost-run) | [![Dependency Status](https://david-dm.org/cyclejs/most-run.svg)](https://david-dm.org/cyclejs/most-run) | [![devDependency Status](https://david-dm.org/cyclejs/most-run/dev-status.svg)](https://david-dm.org/cyclejs/most-run#info=devDependencies) |
| `@cycle/rx-adapter` | [![npm version](https://badge.fury.io/js/%40cycle%2Frx-adapter.svg)](http://badge.fury.io/js/%40cycle%2Frx-adapter) | [![Dependency Status](https://david-dm.org/cyclejs/rx-adapter.svg)](https://david-dm.org/cyclejs/rx-adapter) | [![devDependency Status](https://david-dm.org/cyclejs/rx-adapter/dev-status.svg)](https://david-dm.org/cyclejs/rx-adapter#info=devDependencies) |
| `@cycle/rx-run` | [![npm version](https://badge.fury.io/js/%40cycle%2Frx-run.svg)](http://badge.fury.io/js/%40cycle%2Frx-run) | [![Dependency Status](https://david-dm.org/cyclejs/rx-run.svg)](https://david-dm.org/cyclejs/rx-run) | [![devDependency Status](https://david-dm.org/cyclejs/rx-run/dev-status.svg)](https://david-dm.org/cyclejs/rx-run#info=devDependencies) |
| `@cycle/rxjs-adapter` | [![npm version](https://badge.fury.io/js/%40cycle%2Frxjs-adapter.svg)](http://badge.fury.io/js/%40cycle%2Frxjs-adapter) | [![Dependency Status](https://david-dm.org/cyclejs/rxjs-adapter.svg)](https://david-dm.org/cyclejs/rxjs-adapter) | [![devDependency Status](https://david-dm.org/cyclejs/rxjs-adapter/dev-status.svg)](https://david-dm.org/cyclejs/rxjs-adapter#info=devDependencies) |
| `@cycle/rxjs-run` | [![npm version](https://badge.fury.io/js/%40cycle%2Frxjs-run.svg)](http://badge.fury.io/js/%40cycle%2Frxjs-run) | [![Dependency Status](https://david-dm.org/cyclejs/rxjs-run.svg)](https://david-dm.org/cyclejs/rxjs-run) | [![devDependency Status](https://david-dm.org/cyclejs/rxjs-run/dev-status.svg)](https://david-dm.org/cyclejs/rxjs-run#info=devDependencies) |
| `@cycle/xstream-adapter` | [![npm version](https://badge.fury.io/js/%40cycle%2Fxstream-adapter.svg)](http://badge.fury.io/js/%40cycle%2Fxstream-adapter) | [![Dependency Status](https://david-dm.org/cyclejs/xstream-adapter.svg)](https://david-dm.org/cyclejs/xstream-adapter) | [![devDependency Status](https://david-dm.org/cyclejs/xstream-adapter/dev-status.svg)](https://david-dm.org/cyclejs/xstream-adapter#info=devDependencies) |
| `@cycle/xstream-run` | [![npm version](https://badge.fury.io/js/%40cycle%2Fxstream-run.svg)](http://badge.fury.io/js/%40cycle%2Fxstream-run) | [![Dependency Status](https://david-dm.org/cyclejs/xstream-run.svg)](https://david-dm.org/cyclejs/xstream-run) | [![devDependency Status](https://david-dm.org/cyclejs/xstream-run/dev-status.svg)](https://david-dm.org/cyclejs/xstream-run#info=devDependencies) |

### Stream libraries

The following packages are not under Cycle.js, but are important dependencies, so we display their latest versions for convenience.

| Package | Version |
|--------|-------|
| `most` | [![npm version](https://badge.fury.io/js/most.svg)](http://badge.fury.io/js/most) |
| `rx` | [![npm version](https://badge.fury.io/js/rx.svg)](http://badge.fury.io/js/rx) |
| `rxjs` | [![npm version](https://badge.fury.io/js/rxjs.svg)](http://badge.fury.io/js/rxjs) |
| `xstream` | [![npm version](https://badge.fury.io/js/xstream.svg)](http://badge.fury.io/js/xstream) |

## LICENSE

[The MIT License](https://github.com/cyclejs/cyclejs/blob/master/LICENSE)
