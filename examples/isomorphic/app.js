/** @jsx hJSX */
'use strict';
let Cycle = require('@cycle/core');
let {h, hJSX} = require('@cycle/dom');

function renderMenu() {
  return (
    <ul>
      <li><a className="link" href="/">Home</a></li>
      <li><a className="link" href="/about">About</a></li>
    </ul>
  );
}

function renderHomePage() {
  return (
    <section className="home">
      <h1>The homepage</h1>
      <p>Welcome to our spectacular web page with literally nothing special here.</p>
      {renderMenu()}
    </section>
  );
}

function renderAboutPage() {
  return (
    <section className="about">
      <h1>Read more about us</h1>
      <p>This is the page where we describe ourselves.</p>
      <p>Contact us</p>
      {renderMenu()}
    </section>
  );
}

function app(ext) {
  let routeFromClick$ = ext.DOM.get('.link', 'click')
    .doOnNext(ev => ev.preventDefault())
    .map(ev => ev.currentTarget.attributes.href.value);

  let ongoingContext$ = ext.context
    .merge(routeFromClick$).scan((acc, x) => {
      acc.route = x;
      return acc;
    });

  let vtree$ = ongoingContext$
    .map(({route}) => {
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', route);
      }
      switch (route) {
        case '/': return renderHomePage();
        case '/about': return renderAboutPage();
        default: return (<div>Unknown page {route}</div>)
      }
    });

  return {
    DOM: vtree$
  };
}

module.exports = {
  app
};
