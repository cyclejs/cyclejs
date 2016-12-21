// HTTP Search Github :  Intermediate Example

import Cycle from '@cycle/xstream-run';
import xs from 'xstream';
import debounce from 'xstream/extra/debounce';
import {div, label, input, hr, ul, li, a, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';


// logger utility to inject into streams for inspection
const show = x => {
  // console.log(JSON.stringify(x))
  console.log(x)
  return x
}


function main(sources) {

  // Requests for Github repositories happen when the input field changes,
  // debounced by 500ms, ignoring empty input field.
  const searchRequest$ = sources.DOM.select('.field')
    .events('input')

    // apply function to the stream
    .compose(debounce(500))
    .map(ev => ev.target.value)
    .filter(query => query.length > 0)

    // -> stream of request objects : Stream<Object>
    .map(q => ({
      category: 'github',
      url: `https://api.github.com/search/repositories?q=${encodeURI(q)}`,
    }));

  // Requests unrelated to the Github search. This is to demonstrate
  // how filtering for the HTTP response category is necessary.
  const otherRequest$ = xs

    // emit stream of numbers
    .periodic(1000)

    // complete stream after 2 events
    .take(2)

    // map into the same object
    .mapTo({
      category: 'peekier',

      // support less known search engine ;-)
      url: 'http://peekier.com', 
    });


  // Convert the stream of HTTP responses to virtual DOM elements.
  const vtree$ = sources.HTTP.select('github')

    // Stream<Stream<Object>> -> Stream<Object>
    // https://github.com/cyclejs/cyclejs/blob/master/http/src/index.ts#L42
    .flatten()

    // -> search results : Stream<Array>
    .map(res => res.body.items)

    // inspect results in console
    .map(show)
    .startWith([])
    .map(results =>

      div([
        label('.label', 'Search Github: '),
        input('.field', {attrs: {type: 'text'}}),
        hr(),
        ul('.search-results', results.map(result =>

          li('.search-result', [
            a({attrs: {href: result.html_url}}, result.name)
          ])

        ))
      ])

    );


  return {

    // export combined stream of all request objects
    HTTP: xs.merge(searchRequest$, otherRequest$),
    DOM: vtree$,
  };
}

Cycle.run(main, {
  // DOM: makeDOMDriver('#main-container'),
  DOM: makeDOMDriver(document.body),
  HTTP: makeHTTPDriver()
});
