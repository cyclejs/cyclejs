<h1>
<img src="https://raw.github.com/cyclejs/cycle-core/master/logo.png" /> Cycle.js
</h1>

> Cycle.js is a fully reactive JavaScript framework for Human-Computer Interaction.

Cycle *Core* is the minimum required tools you need for building applications. It is comprised of one single function, `Cycle.run(main, drivers)`.

## Installing

[![npm version](https://badge.fury.io/js/%40cycle%2Fcore.svg)](http://badge.fury.io/js/%40cycle%2Fcore)

`npm install rx @cycle/core`

Note: `rx` is a **required** dependency. Without it, nothing will change.

## What to Use Cycle.js for and When to Use It

Cycle.js provides a lightweight framework which benefits from [RxJS Observables](http://cycle.js.org/observables.html), providing a functional and reactive environment where you can keep your **application logic** in clean **pure functions** and isolated from **side effects**, contained in **drivers**, like DOM mutations or HTML5 Notifications.

Cycle.js makes your application logic more reusable. As it is separated in pure functions, it is easy to switch from one driver to another, while your logic keeps untouched.

Every Cycle.js app is a composable function, meaning that it can be reused in a larger Cycle.js app. This allows, unlike other frameworks, to build highly reusable components, from GUI components to Web Audio or network requests.

Use it to improve your code readability, taking advantage of Observable declarations for creating explicit dataflows, which otherwise would not be as clear.

## I came here because I want to...

- Understand how Cycle.js works in general: go to http://cycle.js.org
- Understand how Cycle *Core* itself works: read the [docs](https://github.com/cyclejs/cycle-core/blob/master/docs/api.md) and the [tests](https://github.com/cyclejs/cycle-core/tree/master/test)
- File a bug report for anything Cycle-related: [open an issue](https://github.com/cyclejs/cycle-core/issues/new)
- Ask a question such as "How do I ...?" on one of these channels:  
  - Ask it in the [Gitter chat room](https://gitter.im/cyclejs/cycle-core)
  - [Open a StackOverflow question with `cyclejs` tag](http://stackoverflow.com/questions/tagged/cyclejs) 
  - [Open an issue here](https://github.com/cyclejs/cycle-core/issues/new). Please note all discussion-like issues are labeled `discussion` and immediately closed. This doesn't mean we disconsidered your discussion. We only leave actual issues open.
- [Read discussion issues](https://github.com/cyclejs/cycle-core/issues?q=label%3Adiscussion+is%3Aclosed)
- Contribute a new driver: [open an issue](https://github.com/cyclejs/cycle-core/issues/new)

## LICENSE

[The MIT License (MIT)](https://github.com/cyclejs/cycle-core/blob/master/LICENSE)

- - -

[![Build Status](https://travis-ci.org/cyclejs/cycle-core.svg?branch=master)](https://travis-ci.org/cyclejs/cycle-core)
[![Code Climate](https://codeclimate.com/github/cyclejs/cycle-core/badges/gpa.svg)](https://codeclimate.com/github/cyclejs/cycle-core)
[![Dependency Status](https://david-dm.org/cyclejs/cycle-core.svg)](https://david-dm.org/cyclejs/cycle-core)
[![devDependency Status](https://david-dm.org/cyclejs/cycle-core/dev-status.svg)](https://david-dm.org/cyclejs/cycle-core#info=devDependencies)
[![JS.ORG](https://img.shields.io/badge/js.org-cycle-ffb400.svg?style=flat-square)](http://js.org)
