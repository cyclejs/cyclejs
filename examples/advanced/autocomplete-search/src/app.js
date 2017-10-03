import xs from 'xstream'
import debounce from 'xstream/extra/debounce'
import dropUntil from 'xstream/extra/dropUntil'
import {ul, li, span, input, div, section, label} from '@cycle/dom'
import Immutable from 'immutable'

const containerStyle = {
  background: '#EFEFEF',
  padding: '5px',
}

const sectionStyle = {
  marginBottom: '10px',
}

const searchLabelStyle = {
  display: 'inline-block',
  width: '100px',
  textAlign: 'right',
}

const comboBoxStyle = {
  position: 'relative',
  display: 'inline-block',
  width: '300px',
}

const inputTextStyle = {
  padding: '5px',
}

const autocompleteableStyle = Object.assign({}, inputTextStyle, {
  width: '100%',
  boxSizing: 'border-box',
})

const autocompleteMenuStyle = {
  position: 'absolute',
  left: '0px',
  right: '0px',
  top: '25px',
  zIndex: '999',
  listStyle: 'none',
  backgroundColor: 'white',
  margin: '0',
  padding: '0',
  borderTop: '1px solid #ccc',
  borderLeft: '1px solid #ccc',
  borderRight: '1px solid #ccc',
  boxSizing: 'border-box',
  boxShadow: '0px 4px 4px rgb(220,220,220)',
  userSelect: 'none',
  '-moz-box-sizing': 'border-box',
  '-webkit-box-sizing': 'border-box',
  '-webkit-user-select': 'none',
  '-moz-user-select': 'none',
}

const autocompleteItemStyle = {
  cursor: 'pointer',
  listStyle: 'none',
  padding: '3px 0 3px 8px',
  margin: '0',
  borderBottom: '1px solid #ccc',
}

const LIGHT_GREEN = '#8FE8B4'

/**
 * source: --a--b----c----d---e-f--g----h---i--j-----
 * first:  -------F------------------F---------------
 * second: -----------------S-----------------S------
 *                         between
 * output: ----------c----d-------------h---i--------
 */
function between(first, second) {
  return (source) => first.mapTo(source.endWhen(second)).flatten()
}

/**
 * source: --a--b----c----d---e-f--g----h---i--j-----
 * first:  -------F------------------F---------------
 * second: -----------------S-----------------S------
 *                       notBetween
 * output: --a--b-------------e-f--g-----------j-----
 */
function notBetween(first, second) {
  return source => xs.merge(
    source.endWhen(first),
    first.map(() => source.compose(dropUntil(second))).flatten()
  )
}

function intent(domSource, timeSource) {
  const UP_KEYCODE = 38
  const DOWN_KEYCODE = 40
  const ENTER_KEYCODE = 13
  const TAB_KEYCODE = 9

  const input$ = domSource.select('.autocompleteable').events('input')
  const keydown$ = domSource.select('.autocompleteable').events('keydown')
  const itemHover$ = domSource.select('.autocomplete-item').events('mouseenter')
  const itemMouseDown$ = domSource.select('.autocomplete-item').events('mousedown')
  const itemMouseUp$ = domSource.select('.autocomplete-item').events('mouseup')
  const inputFocus$ = domSource.select('.autocompleteable').events('focus')
  const inputBlur$ = domSource.select('.autocompleteable').events('blur')

  const enterPressed$ = keydown$.filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const tabPressed$ = keydown$.filter(({keyCode}) => keyCode === TAB_KEYCODE)
  const clearField$ = input$.filter(ev => ev.target.value.length === 0)
  const inputBlurToItem$ = inputBlur$.compose(between(itemMouseDown$, itemMouseUp$))
  const inputBlurToElsewhere$ = inputBlur$.compose(notBetween(itemMouseDown$, itemMouseUp$))
  const itemMouseClick$ = itemMouseDown$
    .map(down => itemMouseUp$.filter(up => down.target === up.target))
    .flatten()

  return {
    search$: input$
      .compose(timeSource.debounce(500))
      .compose(between(inputFocus$, inputBlur$))
      .map(ev => ev.target.value)
      .filter(query => query.length > 0),
    moveHighlight$: keydown$
      .map(({keyCode}) => { switch (keyCode) {
        case UP_KEYCODE: return -1
        case DOWN_KEYCODE: return +1
        default: return 0
      }})
      .filter(delta => delta !== 0),
    setHighlight$: itemHover$
      .map(ev => parseInt(ev.target.dataset.index)),
    keepFocusOnInput$:
      xs.merge(inputBlurToItem$, enterPressed$, tabPressed$),
    selectHighlighted$:
      xs.merge(itemMouseClick$, enterPressed$, tabPressed$).compose(debounce(1)),
    wantsSuggestions$:
      xs.merge(inputFocus$.mapTo(true), inputBlur$.mapTo(false)),
    quitAutocomplete$:
      xs.merge(clearField$, inputBlurToElsewhere$),
  }
}

function reducers(actions) {
  const moveHighlightReducer$ = actions.moveHighlight$
    .map(delta => function moveHighlightReducer(state) {
      const suggestions = state.get('suggestions')
      const wrapAround = x => (x + suggestions.length) % suggestions.length
      return state.update('highlighted', highlighted => {
        if (highlighted === null) {
          return wrapAround(Math.min(delta, 0))
        } else {
          return wrapAround(highlighted + delta)
        }
      })
    })

  const setHighlightReducer$ = actions.setHighlight$
    .map(highlighted => function setHighlightReducer(state) {
      return state.set('highlighted', highlighted)
    })

  const selectHighlightedReducer$ = actions.selectHighlighted$
    .mapTo(xs.of(true, false))
    .flatten()
    .map(selected => function selectHighlightedReducer(state) {
      const suggestions = state.get('suggestions')
      const highlighted = state.get('highlighted')
      const hasHighlight = highlighted !== null
      const isMenuEmpty = suggestions.length === 0
      if (selected && hasHighlight && !isMenuEmpty) {
        return state
          .set('selected', suggestions[highlighted])
          .set('suggestions', [])
      } else {
        return state.set('selected', null)
      }
    })

  const hideReducer$ = actions.quitAutocomplete$
    .mapTo(function hideReducer(state) {
      return state.set('suggestions', [])
    })

  return xs.merge(
    moveHighlightReducer$,
    setHighlightReducer$,
    selectHighlightedReducer$,
    hideReducer$
  )
}

function model(suggestionsFromResponse$, actions) {
  const reducer$ = reducers(actions)

  const state$ = actions.wantsSuggestions$
    .map(accepted =>
      suggestionsFromResponse$.map(suggestions => accepted ? suggestions : [])
    )
    .flatten()
    .startWith([])
    .map(suggestions => Immutable.Map(
      {suggestions, highlighted: null, selected: null}
    ))
    .map(state => reducer$.fold((acc, reducer) => reducer(acc), state))
    .flatten()

  return state$
}

function renderAutocompleteMenu({suggestions, highlighted}) {
  if (suggestions.length === 0) { return ul() }
  const childStyle = index => (Object.assign({}, autocompleteItemStyle, {
    backgroundColor: highlighted === index ? LIGHT_GREEN : null
  }))

  return ul('.autocomplete-menu', {style: autocompleteMenuStyle},
    suggestions.map((suggestion, index) =>
      li('.autocomplete-item',
        {style: childStyle(index), attrs: {'data-index': index}},
        suggestion
      )
    )
  )
}

function renderComboBox({suggestions, highlighted, selected}) {
  return span('.combo-box', {style: comboBoxStyle}, [
    input('.autocompleteable', {
      style: autocompleteableStyle,
      attrs: {type: 'text'},
      hook: {
        update: (old, {elm}) => {
          if (selected !== null) {
            elm.value = selected
          }
        }
      }
    }),
    renderAutocompleteMenu({suggestions, highlighted})
  ])
}

function view(state$) {
  return state$.map(state => {
    const suggestions = state.get('suggestions')
    const highlighted = state.get('highlighted')
    const selected = state.get('selected')
    return (
      div('.container', {style: containerStyle}, [
        section({style: sectionStyle}, [
          label('.search-label', {style: searchLabelStyle}, 'Query:'),
          renderComboBox({suggestions, highlighted, selected})
        ]),
        section({style: sectionStyle}, [
          label({style: searchLabelStyle}, 'Some field:'),
          input({style: inputTextStyle, attrs: {type: 'text'}})
        ])
      ])
    )
  })
}

const BASE_URL =
  'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search='

const networking = {
  processResponses(JSONP) {
    return JSONP.filter(res$ => res$.request.indexOf(BASE_URL) === 0)
      .flatten()
      .map(res => res[1])
  },

  generateRequests(searchQuery$) {
    return searchQuery$.map(q => BASE_URL + encodeURI(q))
  },
}

function preventedEvents(actions, state$) {
  return state$
    .map(state =>
      actions.keepFocusOnInput$.map(event => {
        if (state.get('suggestions').length > 0
        && state.get('highlighted') !== null) {
          return event
        } else {
          return null
        }
      })
    )
    .flatten()
    .filter(ev => ev !== null)
}

export default function app(sources) {
  const suggestionsFromResponse$ = networking.processResponses(sources.JSONP)
  const actions = intent(sources.DOM, sources.Time)
  const state$ = model(suggestionsFromResponse$, actions)
  const vtree$ = view(state$)
  const prevented$ = preventedEvents(actions, state$)
  const searchRequest$ = networking.generateRequests(actions.search$)
  return {
    DOM: vtree$,
    preventDefault: prevented$,
    JSONP: searchRequest$,
  }
}
