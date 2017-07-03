import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {run} from '@cycle/run';
import {makeHashHistoryDriver} from '@cycle/history';
import {h, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  // stream of strings to be passed into the history driver
  const history$ = sources.DOM.select('nav').events('click')
    .map(e => e.target.dataset.page)
    .compose(dropRepeats())

  return {
    // ideally you will map this into your state or something first before
    // displaying it as a view.
    // here you can get creative and do whatever you want.
    // even an if-else statement to map to different views entirely
    DOM: sources.history.map(view),

    // history driver accepts either objects or string to update the url
    history: history$
  };
}

function view({ pathname, search, hash }) {
  return h('div', [
    navigation( pathname ),
    h('h1', 'History object'),
    h('h3', [
      h('span', 'Pathname: '),
      h('label', pathname )
    ]),
    h('h3', [
      h('span', 'Search: '),
      h('label', search )
    ]),
    h('h3', [
      h('span', 'Hash: '),
      h('label', hash )
    ])
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
    }, 'contacts')
  ])
}

run(main, {
  DOM: makeDOMDriver('#app'),
  history: makeHashHistoryDriver()
});

