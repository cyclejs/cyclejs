<h1 align="center">Cycle.js</h1>

<div align="center">
  <img alt="logo" src="https://raw.githubusercontent.com/cyclejs/cyclejs/master/logo.png" width="128">
</div>
<div align="center">
  <strong>A functional and reactive JavaScript framework for predictable code</strong>
</div>

<div align="center">
  <h3>
    <a href="https://cycle.js.org">
      Website
    </a>
    <span> | </span>
    <a href="#packages">
      Packages
    </a>
    <span> | </span>
    <a href="https://github.com/cyclejs/cyclejs/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22">
      Contribute
    </a>
    <span> | </span>
    <a href="https://gitter.im/cyclejs/cyclejs">
      Chat
    </a>
     <span> | </span>
    <a href="#support">
      Support
    </a>
  </h3>
</div>

<div align="center">
  <!-- Build Status -->
</div>

## Welcome

| Question | Answer |
|--------|-------|
| "I want to learn Cycle.js" | [Read the official documentation](https://cycle.js.org) |
| "I have a question" | [Join the chat](https://gitter.im/cyclejs/cyclejs)<br />Or<br />[Create a StackOverflow question](http://stackoverflow.com/questions/tagged/cyclejs)<br />Or<br />[Open an issue](https://github.com/cyclejs/cyclejs/issues/new) <br /><sub>Please note all discussion-like issues are labeled discussion and immediately closed. This doesn't mean we unconsidered your discussion. We only leave actual issues open.</sub> |
| "I found a bug" | [Open an issue](https://github.com/cyclejs/cyclejs/issues/new) |
| "I want to help build Cycle.js" | [Read the Contributing guides](https://github.com/cyclejs/cyclejs/blob/master/CONTRIBUTING.md)<br />Then<br />[Choose an issue marked "help wanted"](https://github.com/cyclejs/cyclejs/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) |

## Packages

Cycle.js is comprised of many specialized packages. This repository contains all these packages, e.g., the npm package `@cycle/run` lives in the directory `run`. Below you will find a summary of each package.

| Package | Version | Dependencies | DevDependencies |
|--------|-------|------------|----------|
| `@cycle/dom` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/dom.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/dom/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=dom)](https://david-dm.org/cyclejs/cyclejs?path=dom) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=dom)](https://david-dm.org/cyclejs/cyclejs?path=dom#info=devDependencies) |
| `@cycle/history` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/history.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/history/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=history)](https://david-dm.org/cyclejs/cyclejs?path=history) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=history)](https://david-dm.org/cyclejs/cyclejs?path=history#info=devDependencies) |
| `@cycle/html` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/html.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/html/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=html)](https://david-dm.org/cyclejs/cyclejs?path=html) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=html)](https://david-dm.org/cyclejs/cyclejs?path=html#info=devDependencies) |
| `@cycle/http` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/http.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/http/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=http)](https://david-dm.org/cyclejs/cyclejs?path=http) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=http)](https://david-dm.org/cyclejs/cyclejs?path=http#info=devDependencies) |
| `@cycle/isolate` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/isolate.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/isolate/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=isolate)](https://david-dm.org/cyclejs/cyclejs?path=isolate) |  [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=isolate)](https://david-dm.org/cyclejs/cyclejs?path=isolate#info=devDependencies) |
| `@cycle/jsonp` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/jsonp.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/jsonp/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=jsonp)](https://david-dm.org/cyclejs/cyclejs?path=jsonp) |  [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=jsonp)](https://david-dm.org/cyclejs/cyclejs?path=jsonp#info=devDependencies) |
| `@cycle/most-run` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/most-run.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/most-run/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=most-run)](https://david-dm.org/cyclejs/cyclejs?path=most-run) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=most-run)](https://david-dm.org/cyclejs/cyclejs?path=most-run#info=devDependencies) |
| `@cycle/run` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/run.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/run/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=run)](https://david-dm.org/cyclejs/cyclejs?path=run) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=run)](https://david-dm.org/cyclejs/cyclejs?path=run#info=devDependencies) |
| `@cycle/rxjs-run` | [![npm (scoped)](https://img.shields.io/npm/v/@cycle/rxjs-run.svg?maxAge=86400)](https://github.com/cyclejs/cyclejs/blob/master/rxjs-run/CHANGELOG.md) | [![Dependency Status](https://david-dm.org/cyclejs/cyclejs.svg?path=rxjs-run)](https://david-dm.org/cyclejs/cyclejs?path=rxjs-run) | [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg?path=rxjs-run)](https://david-dm.org/cyclejs/cyclejs?path=rxjs-run#info=devDependencies) |

Globally: [![Build Status](https://img.shields.io/travis/cyclejs/cyclejs/master.svg?style=flat)](https://travis-ci.org/cyclejs/cyclejs) [![devDependency Status](https://david-dm.org/cyclejs/cyclejs/dev-status.svg)](https://david-dm.org/cyclejs/cyclejs#info=devDependencies)

### Stream libraries

The following packages are not under Cycle.js, but are important dependencies, so we display their latest versions for convenience.

| Package | Version |
|--------|-------|
| `most` | [![npm version](https://img.shields.io/npm/v/most.svg?maxAge=86400)](https://www.npmjs.com/package/most) |
| `rxjs` | [![npm version](https://img.shields.io/npm/v/rxjs.svg?maxAge=86400)](https://www.npmjs.com/package/rxjs) |
| `xstream` | [![npm version](https://img.shields.io/npm/v/xstream.svg?maxAge=86400)](https://www.npmjs.com/package/xstream) |

## Support [![OpenCollective](https://opencollective.com/cyclejs/backers/badge.svg)](#backers) [![OpenCollective](https://opencollective.com/cyclejs/sponsors/badge.svg)](#sponsors)

### Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/cyclejs#backer)]

<a href="https://opencollective.com/cyclejs/backer/0/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/1/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/2/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/3/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/4/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/5/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/6/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/7/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/8/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/9/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/10/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/11/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/12/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/13/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/14/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/15/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/16/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/17/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/18/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/19/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/20/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/21/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/22/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/23/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/24/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/25/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/26/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/27/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/28/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/backer/29/website" target="_blank"><img src="https://opencollective.com/cyclejs/backer/29/avatar.svg"></a>

### Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/cyclejs#sponsor)]

<a href="https://opencollective.com/cyclejs/sponsor/0/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/1/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/2/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/3/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/4/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/5/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/6/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/7/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/8/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/9/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/10/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/11/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/12/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/13/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/14/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/15/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/16/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/17/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/18/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/19/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/20/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/21/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/22/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/23/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/24/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/25/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/26/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/27/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/28/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/cyclejs/sponsor/29/website" target="_blank"><img src="https://opencollective.com/cyclejs/sponsor/29/avatar.svg"></a>

## LICENSE

[The MIT License](https://github.com/cyclejs/cyclejs/blob/master/LICENSE)

- - -

<!-- JS.ORG -->
<a href="http://js.org">
  <img src="https://img.shields.io/badge/js.org-cycle-ffb400.svg?style=flat-square"
    alt="JS.ORG" />
</a>
<a href="https://github.com/staltz/comver">
  <img src="https://img.shields.io/badge/ComVer-compliant-brightgreen.svg" alt="ComVer" />
</a>
