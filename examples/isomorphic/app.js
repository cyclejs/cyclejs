let {div, ul, li, a, section, h1, p} = require('@cycle/dom');

function renderMenu() {
  return (
    ul([
      li([ a('.link', {href: '/'}, 'Home') ]),
      li([ a('.link', {href: '/about'}, 'About') ]),
    ])
  );
}

function renderHomePage() {
  return (
    section('.home', [
      h1('The homepage'),
      p('Welcome to our spectacular web page with nothing special here.'),
      renderMenu(),
    ])
  );
}

function renderAboutPage() {
  return (
    section('.about', [
      h1('Read more about us'),
      p('This is the page where we describe ourselves.'),
      p('Contact us'),
      renderMenu(),
    ])
  );
}

function app(sources) {
  let routeFromClick$ = sources.DOM.select('.link').events('click')
    .doOnNext(ev => ev.preventDefault())
    .map(ev => ev.currentTarget.attributes.href.value);

  let ongoingContext$ = sources.context
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
        default: return div(`Unknown page ${route}`)
      }
    });

  return {
    DOM: vtree$
  };
}

module.exports = app;
