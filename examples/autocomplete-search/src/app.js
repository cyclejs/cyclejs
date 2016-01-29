import {Observable} from 'rx'
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

const autocompleteableStyle = Object.assign(inputTextStyle, {
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

function ControlledInputHook(injectedText) {
  this.injectedText = injectedText
}

ControlledInputHook.prototype.hook = function hook(element) {
  if (this.injectedText !== null) {
    element.value = this.injectedText
  }
}

function between(first, second) {
  return (source) => source.window(first, () => second).switch()
}

function notBetween(first, second) {
  return source => Observable.merge(
    source.takeUntil(first),
    first.flatMapLatest(() => source.skipUntil(second))
  )
}

function intent(DOM) {
  const UP_KEYCODE = 38
  const DOWN_KEYCODE = 40
  const ENTER_KEYCODE = 13
  const TAB_KEYCODE = 9

  const input$ = DOM.select('.autocompleteable').events('input')
  const keydown$ = DOM.select('.autocompleteable').events('keydown')
  const itemHover$ = DOM.select('.autocomplete-item').events('mouseenter')
  const itemMouseDown$ = DOM.select('.autocomplete-item').events('mousedown')
  const itemMouseUp$ = DOM.select('.autocomplete-item').events('mouseup')
  const inputFocus$ = DOM.select('.autocompleteable').events('focus')
  const inputBlur$ = DOM.select('.autocompleteable').events('blur')

  const enterPressed$ = keydown$.filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const tabPressed$ = keydown$.filter(({keyCode}) => keyCode === TAB_KEYCODE)
  const clearField$ = input$.filter(ev => ev.target.value.length === 0)
  const inputBlurToItem$ = inputBlur$.let(between(itemMouseDown$, itemMouseUp$))
  const inputBlurToElsewhere$ = inputBlur$.let(notBetween(itemMouseDown$, itemMouseUp$))
  const itemMouseClick$ = itemMouseDown$.flatMapLatest(mousedown =>
    itemMouseUp$.filter(mouseup => mousedown.target === mouseup.target)
  )

  return {
    search$: input$
      .debounce(500)
      .let(between(inputFocus$, inputBlur$))
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
    keepFocusOnInput$: Observable
      .merge(inputBlurToItem$, enterPressed$, tabPressed$),
    selectHighlighted$: Observable
      .merge(itemMouseClick$, enterPressed$, tabPressed$),
    wantsSuggestions$: Observable.merge(
      inputFocus$.map(() => true),
      inputBlur$.map(() => false)
    ),
    quitAutocomplete$: Observable
      .merge(clearField$, inputBlurToElsewhere$),
  }
}

function modifications(actions) {
  const moveHighlightMod$ = actions.moveHighlight$
    .map(delta => function (state) {
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

  const setHighlightMod$ = actions.setHighlight$
    .map(highlighted => function (state) {
      return state.set('highlighted', highlighted)
    })

  const selectHighlightedMod$ = actions.selectHighlighted$
    .flatMap(() => Observable.from([true, false]))
    .map(selected => function (state) {
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

  const hideMod$ = actions.quitAutocomplete$
    .map(() => function (state) {
      return state.set('suggestions', [])
    })

  return Observable.merge(
    moveHighlightMod$, setHighlightMod$, selectHighlightedMod$, hideMod$
  )
}

function model(suggestionsFromResponse$, actions) {
  const mod$ = modifications(actions)

  const state$ = suggestionsFromResponse$
    .withLatestFrom(actions.wantsSuggestions$,
      (suggestions, accepted) => accepted ? suggestions : []
    )
    .startWith([])
    .map(suggestions => Immutable.Map(
      {suggestions, highlighted: null, selected: null}
    ))
    .flatMapLatest(state => mod$.startWith(state).scan((acc, mod) => mod(acc)))
    .share()

  return state$
}

function renderAutocompleteMenu({suggestions, highlighted}) {
  if (suggestions.length === 0) { return null }
  const childStyle = index => (Object.assign(autocompleteItemStyle, {
    backgroundColor: highlighted === index ? LIGHT_GREEN : null
  }))

  return ul('.autocomplete-menu', {style: autocompleteMenuStyle},
    suggestions.map((suggestion, index) =>
      li('.autocomplete-item',
        {attributes: {'data-index': index}, style: childStyle(index)},
        suggestion
      )
    )
  )
}

function renderComboBox({suggestions, highlighted, selected}) {
  return span('.combo-box', {style: comboBoxStyle}, [
    input('.autocompleteable', {
      type: 'text',
      style: autocompleteableStyle,
      'data-hook': new ControlledInputHook(selected)}
    ),
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
          input({type: 'text', style: inputTextStyle})
        ])
      ])
    )
  })
}

const BASE_URL =
  'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search='

const networking = {
  processResponses(JSONP) {
    return JSONP.filter(res$ => res$.request.url.indexOf(BASE_URL) === 0)
      .switch()
      .map(res => res[1])
  },

  generateRequests(searchQuery$) {
    return searchQuery$.map(q => BASE_URL + encodeURI(q))
  },
}

function preventedEvents(actions, state$) {
  return actions.keepFocusOnInput$
    .withLatestFrom(state$, (event, state) => {
      if (state.get('suggestions').length > 0
      && state.get('highlighted') !== null) {
        return event
      } else {
        return null
      }
    })
    .filter(ev => ev !== null)
}

export default function app(responses) {
  const suggestionsFromResponse$ = networking.processResponses(responses.JSONP)
  const actions = intent(responses.DOM)
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
