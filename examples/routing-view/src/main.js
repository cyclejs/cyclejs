import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {run} from '@cycle/run';
import {makeHashHistoryDriver} from '@cycle/history';
import {h, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const history$ = sources.DOM.select('h4').events('click')
    .map(e => e.target.dataset.url)
    .compose(dropRepeats())

  return {
    DOM: sources.history.map(view),
    history: history$
  };
}

function view({ pathname, search, hash }) {
  return h('div', [
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
    ]),
    h('h1', 'Links'),
    h('h4', { dataset: { url: 'cat' }}, 'Cat'),
    h('h4', { dataset: { url: 'dog' }}, 'Dog'),
    h('h4', { dataset: { url: 'mouse' }}, 'Mouse'),
  ]);
}

run(main, {
  DOM: makeDOMDriver('#app'),
  history: makeHashHistoryDriver()
});

