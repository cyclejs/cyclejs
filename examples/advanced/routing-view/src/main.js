import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {run} from '@cycle/run';
import {makeHashHistoryDriver} from '@cycle/history';
import {div, h1, h3, br, p, nav, span, makeDOMDriver} from '@cycle/dom';
import placeholderText from 'lorem-ipsum';

function navigation(pathname) {
  return nav([
    span({
      dataset: {page: 'home'},
      class: {'active': pathname === '/home'}
    }, 'Home'),
    span({
      dataset: {page: 'about'},
      class: {'active': pathname === '/about'}
    }, 'About'),
    span({
      dataset: {page: 'contacts'},
      class: {'active': pathname === '/contacts'}
    }, 'Contacts')
  ])
}

function homePageView() {
  return div([
    h1('Welcome to History Examples!'),
    p(placeholderText())
  ])
}

function aboutPageView() {
  return div([
    h1('About me'),
    p(placeholderText())
  ])
}

function contactsPageView() {
  return div([
    h1('Contact me'),
    p(placeholderText())
  ])
}

function view(history$) {
  return history$.map(history => {
    const {pathname} = history;
    let page = h1('404 not found');
    if (pathname === '/home') {
      page = homePageView();
    } else if (pathname === '/about') {
      page = aboutPageView();
    } else if (pathname === '/contacts') {
      page = contactsPageView();
    }

    return div([
      navigation(pathname),
      page,
      br(),
      h3('History object'),
      p(JSON.stringify(history))
    ]);
  });
}

function main(sources) {
  const history$ = sources.DOM.select('nav').events('click')
    .map(e => e.target.dataset.page)
    .compose(dropRepeats())

  const vdom$ = view(sources.history);

  return {
    DOM: vdom$,
    history: history$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  history: makeHashHistoryDriver()
});

