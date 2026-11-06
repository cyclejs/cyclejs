import {Stream as xs} from 'xstream';
import {div, ul, li, a, section, h1, p} from './view.js';

function renderMenu() {
  return ul([
    li([a('.link', {attrs: {href: '/'}}, 'Home')]),
    li([a('.link', {attrs: {href: '/about'}}, 'About')]),
  ]);
}

function renderHomePage() {
  return section('.home', [
    h1('The homepage'),
    p('Welcome to our spectacular web page with nothing special here.'),
    renderMenu(),
  ]);
}

function renderAboutPage() {
  return section('.about', [
    h1('Read more about us'),
    p('This is the page where we describe ourselves.'),
    p('Contact us'),
    renderMenu(),
  ]);
}

export default function app(sources) {
  const click$ = sources.DOM.select('.link').events('click');

  const preventedEvent$ = click$;

  const contextFromClick$ = click$.map(ev => {
    const route = ev.currentTarget.attributes.href.value;
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', route);
    }
    return {route};
  });

  const context$ = xs.merge(sources.context, contextFromClick$);

  const vdom$ = context$.map(({route}) => {
    switch (route) {
      case '/':
        return renderHomePage();
      case '/about':
        return renderAboutPage();
      default:
        return div(`Unknown page ${route}`);
    }
  });

  return {
    DOM: vdom$,
    PreventDefault: preventedEvent$,
  };
}
