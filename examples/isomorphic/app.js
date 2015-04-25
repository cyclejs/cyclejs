'use strict';
let Cycle = require('../../lib/cycle');
let {h} = Cycle;

function renderMenu() {
  return h('ul', [
    h('li', [
      h('a.link', {href: '/'}, 'Home')
    ]),
    h('li', [
      h('a.link', {href: '/about'}, 'About')
    ])
  ]);
}

function renderHomePage() {
  return h('section.home', [
    h('h1', 'The homepage'),
    h('p', 'Welcome to our spectacular web page with literally nothing special here.'),
    renderMenu()
  ]);
}

function renderAboutPage() {
  return h('section.about', [
    h('h1', 'Read more about us'),
    h('p', 'This is the page where we describe ourselves.'),
    h('p', 'In reality, I have no idea what I\'m doing.'),
    renderMenu()
  ]);
}

function computer(context$, interaction$) {
  let routeFromClick$ = interaction$.choose('.link', 'click')
    .doOnNext(ev => ev.preventDefault())
    .map(ev => ev.currentTarget.attributes.href.value);

  let ongoingContext$ = context$
    .merge(routeFromClick$).scan((acc, x) => {
      acc.route = x;
      return acc;
    });

  return ongoingContext$
    .map(({route}) => {
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', route);
      }
      switch (route) {
        case '/': return renderHomePage();
        case '/about': return renderAboutPage();
        default: return h('div', `Unknown page ${route}`);
      }
    });
}

function human(vtree$) {
  return Cycle.render(vtree$, '.app-container').interaction$;
}

module.exports = {
  computer,
  human
};
