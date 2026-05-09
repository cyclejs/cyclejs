import xs from 'xstream';
import debounce from 'xstream/extra/debounce';
import {run} from '@cycle/run';
import {div, label, input, hr, ul, li, a, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import {timeDriver} from '@cycle/time';

function main(sources) {
  // Requests for Github repositories happen when the input field changes,
  // debounced by 500ms, ignoring empty input field.
  const searchRequest$ = sources.DOM.select('.field')
    .events('input')
    .compose(sources.Time.debounce(500))
    .map(ev => ev.target.value)
    .filter(query => query.length > 0)
    .map(q => ({
      url: `https://api.github.com/search/repositories?q=${encodeURI(q)}`,
      category: 'github',
    }));

  // Requests unrelated to the Github search. This is to demonstrate
  // how filtering for the HTTP response category is necessary.
  const otherRequest$ = sources.Time.periodic(1000)
    .take(2)
    .mapTo({url: 'http://www.google.com', category: 'google'});

  // Convert the stream of HTTP responses to virtual DOM elements. Each HTTP
  // response is its own stream, so recover errors on the inner response$ before
  // flattening. This keeps later searches alive after one network/API error.
  const searchResult$ = sources.HTTP.select('github')
    .map(response$ => response$.replaceError(error => xs.of({error})))
    .flatten()
    .map(response =>
      response.error
        ? {error: response.error.message}
        : {repositories: response.body.items}
    )
    .startWith({repositories: []});

  const vtree$ = searchResult$.map(result =>
    div([
      label('.label', 'Search:'),
      input('.field', {attrs: {type: 'text'}}),
      hr(),
      result.error
        ? div('.error', `Error: ${result.error}`)
        : ul(
            '.search-results',
            result.repositories.map(repo =>
              li('.search-result', [
                a({attrs: {href: repo.html_url}}, repo.name),
              ])
            )
          ),
    ])
  );

  const request$ = xs.merge(searchRequest$, otherRequest$);

  return {
    DOM: vtree$,
    HTTP: request$,
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver(),
  Time: timeDriver,
});
