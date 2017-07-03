import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {run} from '@cycle/run';
import {makeHashHistoryDriver} from '@cycle/history';
import {h, makeDOMDriver} from '@cycle/dom';

import placeholderText from 'lorem-ipsum';

function main(sources) {
  // stream of strings to be passed into the history driver
  const history$ = sources.DOM.select('nav').events('click')
    .map(e => e.target.dataset.page)
    .compose(dropRepeats())

  return {
    // souurce.history emits a history object each time there's a route change
    // ideally you will map this into your state or something first before
    // displaying it as a view. then you can do whatever you want...
    // an if-else statement to map to different views entirely
    // or maps to an entire component call directly
    // or use your own pattern matching library. etc
    DOM: sources.history.map(view),

    // history driver accepts either objects or string to update the url
    history: history$
  };
}

function view({ pathname, search, hash, state }) {
  let page = h('h1', '404 not found');
  if (pathname === '/home') {
    page = homePageView();
  } else if (pathname === '/about') {
    page = aboutPageView();
  } else if (pathname === '/contacts') {
    page = contactsPageView();
  }

  return h('div', [
    navigation( pathname ),
    page,
    h('br'),
    h('h3', 'History object'),
    h('h4', [
      h('span', 'Pathname: '),
      h('label', pathname )
    ]),
    h('h4', [
      h('span', 'Search: '),
      h('label', search )
    ]),
    h('h4', [
      h('span', 'Hash: '),
      h('label', hash )
    ]),
    h('h4', [
      h('span', 'State: '),
      h('label', JSON.stringify(state) )
    ]),

  ]);
}

function navigation( pathname ) {
  return h('nav', {}, [
    h('span', {
      dataset : { page: 'home' },
      class : { 'active': pathname === '/home' }
    }, 'Home'),
    h('span', {
      dataset : { page: 'about' },
      class : { 'active': pathname === '/about' }
    }, 'About'),
    h('span', {
      dataset : { page: 'contacts' },
      class : { 'active': pathname === '/contacts' }
    }, 'Contacts')
  ])
}

function homePageView() {
  return h('div', {}, [
    h('h1', 'Welcome to History Examples!'),
    h('p', placeholderText())
  ])
}

function aboutPageView() {
  return h('div', {}, [
    h('h1', 'About me'),
    h('p', placeholderText())
  ])
}

function contactsPageView() {
  return h('div', {}, [
    h('h1', 'Contact me'),
    h('p', placeholderText())
  ])
}

run(main, {
  DOM: makeDOMDriver('#app'),
  history: makeHashHistoryDriver()
});

