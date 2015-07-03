import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/web';
import {makeHTTPDriver} from '@cycle/http';

function main(responses) {
  const GITHUB_SEARCH_API = 'https://api.github.com/search/repositories?q=';

  const searchRequest$ = responses.DOM.get('.field', 'input')
    .debounce(500)
    .map(ev => ev.target.value)
    .filter(query => query.length > 0)
    .map(q => GITHUB_SEARCH_API + encodeURI(q));

  const vtree$ = responses.HTTP
    .filter(res$ => res$.request.indexOf(GITHUB_SEARCH_API) === 0)
    .flatMap(x => x)
    .map(res => res.body.items)
    .startWith([])
    .map(results =>
      h('div', [
        h('label.label', 'Search:'),
        h('input.field', {attributes: {type: 'text'}}),
        h('hr'),
        h('ul.search-results', results.map(result =>
          h('li.search-result', [
            h('a', {href: result.html_url}, result.name)
          ])
        ))
      ])
    );

  return {
    DOM: vtree$,
    HTTP: searchRequest$
  };
}

const drivers = {
  DOM: makeDOMDriver('.js-container'),
  HTTP: makeHTTPDriver()
}

Cycle.run(main, drivers);
