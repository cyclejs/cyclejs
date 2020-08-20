import xs, {MemoryStream, Stream} from 'xstream'
import debounce from 'xstream/extra/debounce'
import dropUntil from 'xstream/extra/dropUntil'
import {div, input, label, li, MainDOMSource, section, span, ul, VNode} from '@cycle/dom'
import Immutable from 'immutable'
import {TimeSource} from "@cycle/time/lib/cjs/src/time-source";
import {ResponseStream} from "@cycle/jsonp/src/index";
import {Reducer, StateSource} from '@cycle/state';
import isolate from '@cycle/isolate';
import {ListState, ResultList} from "./ResultList";

const containerStyle = {
  backgroundColor: 'transparent',
  padding: '5px',
  display: 'block',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '15%'
}

const sectionStyle = {
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
}

const searchLabelStyle = {
  display: 'block',
  textAlign: 'center',
  fontSize: '40px',
  color: 'white',
  fontWeight: 'bold',
  marginBottom: '20px',
}

const comboBoxStyle = {
  position: 'relative',
  display: 'block',
  width: '300px',
}

const inputTextStyle = {
  padding: '3px 0 3px 14px',
  fontSize: '25px',
  height: '44px',
  borderRadius: '12px',
  borderColor: 'white',
}

const autocompleteableStyle = Object.assign({}, inputTextStyle, {
  width: '100%',
  boxSizing: 'border-box',
})

const autocompleteMenuStyle = {
  position: 'absolute',
  left: '0px',
  right: '0px',
  top: '44px',
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
  padding: '5px 0 5px 14px',
  margin: '0',
  borderBottom: '1px solid #ccc',
}

export function resultItemStyle(opacity : number, top : number) {
  return {
    position: 'relative',
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
    listStyle: 'none',
    margin: '20px',
    opacity: `${opacity}%`,
    top:     `${top}px`,
  }
}

export const resultItemDeleteButtonStyle = {
  padding: '5px',
  margin: '0px 20px',
  backgroundColor: 'transparent',
  backgroundRepeat:'no-repeat',
  border: '2px solid white',
  color: 'white',
  borderRadius: '5px',
}

const LIGHT_GREEN = '#8FE8B4'

/**
 * source: --a--b----c----d---e-f--g----h---i--j-----
 * first:  -------F------------------F---------------
 * second: -----------------S-----------------S------
 *                         between
 * output: ----------c----d-------------h---i--------
 */
function between<T>(first: Stream<any>, second: Stream<any>): (so: Stream<T>) => Stream<T> {
  return (source: Stream<T>) => first.mapTo(source.endWhen(second)).flatten()
}

/**
 * source: --a--b----c----d---e-f--g----h---i--j-----
 * first:  -------F------------------F---------------
 * second: -----------------S-----------------S------
 *                       notBetween
 * output: --a--b-------------e-f--g-----------j-----
 */
function notBetween<T>(first: Stream<any>, second: Stream<any>): (so: Stream<T>) => Stream<T> {
  return (source: Stream<T>) => xs.merge(
    source.endWhen(first),
    first.map(() => source.compose(dropUntil(second))).flatten()
  )
}

export interface DefinedObject {
  // instead [name: string]: string | undefined;
  // making the compiler happy without nostrict mode
  [name: string]: string;
}

interface Actions {
  search$:            Stream<string>,
  moveHighlight$:     Stream<1 | -1>,
  keyboardMove$:      Stream<KeyboardEvent>,
  setHighlight$:      Stream<number>
  keepFocusOnInput$:  Stream<Event | KeyboardEvent>
  selectHighlighted$: Stream<Event | KeyboardEvent>
  wantsSuggestions$:  Stream<boolean>
  quitAutocomplete$:  Stream<Event>
}

export interface Result {
  selected: string
  id: number
}

function intent(domSource: MainDOMSource, timeSource: TimeSource) : Actions {
  const UP_KEYCODE    = 38
  const DOWN_KEYCODE  = 40
  const ENTER_KEYCODE = 13
  const TAB_KEYCODE   = 9
  
  const keydown$       : Stream<KeyboardEvent> = domSource.select('.autocompleteable') .events('keydown')
  const input$         : Stream<Event>         = domSource.select('.autocompleteable') .events('input')
  const itemHover$     : Stream<Event>         = domSource.select('.autocomplete-item').events('mouseenter')
  const itemMouseDown$ : Stream<Event>         = domSource.select('.autocomplete-item').events('mousedown')
  const itemMouseUp$   : Stream<Event>         = domSource.select('.autocomplete-item').events('mouseup')
  const inputFocus$    : Stream<Event>         = domSource.select('.autocompleteable') .events('focus')
  const inputBlur$     : Stream<Event>         = domSource.select('.autocompleteable') .events('blur')

  const enterPressed$ = keydown$.filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const tabPressed$   = keydown$.filter(({keyCode}) => keyCode === TAB_KEYCODE)
  const UpPressed$    = keydown$.filter(({keyCode}) => keyCode === UP_KEYCODE)
  const DownPressed$  = keydown$.filter(({keyCode}) => keyCode === DOWN_KEYCODE)
  const clearField$   = input$  .filter(ev => (ev.target as HTMLInputElement).value.length === 0)
  const inputBlurToItem$      = inputBlur$.compose(between   (itemMouseDown$, itemMouseUp$))
  const inputBlurToElsewhere$ = inputBlur$.compose(notBetween(itemMouseDown$, itemMouseUp$))
  const itemMouseClick$ = itemMouseDown$
                            .map(down => itemMouseUp$.filter(up => down.target === up.target))
                            .flatten()
  return {
    search$: input$
      .compose(timeSource.debounce(500))
      .compose(between(inputFocus$, inputBlur$))
      .map(ev => (ev.target as HTMLInputElement).value)
      .filter(query => query.length > 0),
    keyboardMove$:
      xs.merge(UpPressed$, DownPressed$),
    moveHighlight$: keydown$
      .map(({keyCode}) => {
        switch (keyCode) {
          case UP_KEYCODE:   return -1
          case DOWN_KEYCODE: return +1
          default:           return 0
      }})
      .filter(notZero),
    setHighlight$: xs.merge(itemHover$, itemMouseDown$)
      .map(ev => parseInt(((ev.target as HTMLInputElement).dataset as DefinedObject).index)),
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

function notZero(n: -1 | 0 | 1): n is (-1 | 1) {
  return n !== 0;
}

function reducers(actions : Actions, suggestionsFromResponse$ : Stream<string[]>): Stream<Reducer<State>> {
  
  const moveHighlightReducer$ = actions.moveHighlight$
    .map(delta => function moveHighlightReducer(state : State) : State {
      const suggestions : string[] = state.get('suggestions')
      const wrapAround = (x: number) => (x + suggestions.length) % suggestions.length
      return state.update('highlighted', (highlighted: number) => {
        if (highlighted === null) {
          return wrapAround(Math.min(delta, 0))
        } else {
          return wrapAround(highlighted + delta)
        }
      })
    })

  const setHighlightReducer$ = actions.setHighlight$
    .map((highlighted: number) => function setHighlightReducer(state : State) : State {
      return state.set('highlighted', highlighted)
    })

  const selectHighlightedReducer$ = actions.selectHighlighted$
    .mapTo(xs.of(true, false))
    .flatten()
    .map(isSelected => function selectHighlightedReducer(state : State) : State {
      const suggestions : string[] = state.get('suggestions')
      const highlighted : number   = state.get('highlighted')
      const results     : Result[] = state.get('results')
      const isMenuEmpty = suggestions.length === 0
      const hasHighlight = highlighted !== null;
      if (isSelected && hasHighlight && !isMenuEmpty) {
        const selected = suggestions[highlighted];
        let highestId = results.length >= 1 ? results[results.length-1].id : -1;
        return state
          .set('selected'   , selected)
          .set('suggestions', [])
          .set('results'    , [...results, {selected, id: ++highestId }])
      } else {
        return state.set('selected', null)
      }
    })

  const hideReducer$ = actions.quitAutocomplete$
    .mapTo(function hideReducer(state : State) : State {
      return state.set('suggestions', [])
    })
  
  const comboBoxReducer$ = actions.wantsSuggestions$
    .map(wants =>
          suggestionsFromResponse$.map((suggestions: string[]) => wants ? suggestions : [])
    )
    .flatten()
    .startWith([])
    .map((suggestions: string[]) =>
          function comboBoxReducer(state : State) : State {
            return state.set('highlighted', null)
                        .set('selected'   , null)
                        .set("suggestions", suggestions)
    })
  
  return xs.merge(
    moveHighlightReducer$,
    setHighlightReducer$,
    selectHighlightedReducer$,
    hideReducer$,
    comboBoxReducer$,
  )
}

function model(suggestionsFromResponse$ : Stream<string[]>, actions : Actions) : Stream<Reducer<State>> {
  const init$ = xs.of<Reducer<State>>(() => Immutable.Map({ suggestions: [],
                                                            highlighted: null,
                                                            selected   : null,
                                                            results    : []   }));
  const reducer$ : Stream<Reducer<State>> = reducers(actions, suggestionsFromResponse$)
  return xs.merge(init$, reducer$);
}

function renderAutocompleteMenu(
  {suggestions, highlighted}:{suggestions: string[], highlighted: number}) : VNode {
  
    if (suggestions.length === 0) {
      return ul()
    }
    else {
      const childStyle = (index : number) => (Object.assign({}, autocompleteItemStyle, {
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
}

function renderComboBox(
  {suggestions, highlighted, selected}: {suggestions: string[], highlighted: number, selected: string}) : VNode {
    return span('.combo-box', {style: comboBoxStyle}, [
      input('.autocompleteable', {
        style: autocompleteableStyle,
        attrs: {type: 'text'},
        hook: {
          update: (old:any, {elm}:{elm:any}) => {
            if (selected !== null) {
              elm.value = selected
            }
          }
        }
      }),
      renderAutocompleteMenu({suggestions, highlighted})
    ])
}

function view(state$: Stream<State>, resultListDOM$: Stream<VNode>, timeSource: TimeSource) : MemoryStream<VNode> {
  return xs.combine(state$, resultListDOM$).map(([state, resultListDOM]) => {
    const suggestions : string[] = state.get('suggestions')
    const highlighted : number   = state.get('highlighted')
    const selected    : string   = state.get('selected')
    return (
      div('.container', {style: containerStyle}, [
        section({style: sectionStyle}, [
          label('.search-label', {style: searchLabelStyle}, 'Query'),
          renderComboBox({suggestions, highlighted, selected})
        ]),
        section({style: sectionStyle}, [
          resultListDOM
        ]),
        // section({style: sectionStyle}, [
        //   label({style: searchLabelStyle}, 'Some field:'),
        //   input({style: inputTextStyle, attrs: {type: 'text'}})
        // ])
      ])
    )
  })
}

const BASE_URL : string =
  'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search='

const networking = {
  
  processResponses(JSONP : Stream<ResponseStream>) : Stream<string[]> {
    return JSONP.filter(res$ => res$.request.indexOf(BASE_URL) === 0)
      .flatten()
      .map(res => res[1])
  },

  generateRequests(searchQuery$ : Stream<string>) : Stream<string> {
    return searchQuery$.map((q:string) => BASE_URL + encodeURI(q))
  },
}

function preventedEvents(actions : Actions, state$ : Stream<State>) : Stream<Event> {
  const focusPrevent$ = state$
    .map(state =>
      actions.keepFocusOnInput$.map(event => {
        if (state.get('suggestions').length > 0 &&
            state.get('highlighted') !== null)
        {
          return event
        } else {
          return null
        }
      })
    )
    .flatten()
    .filter(someEvent)
  return xs.merge(focusPrevent$, actions.keyboardMove$)
}

function someEvent(input: Event|null): input is Event {
  return input !== null;
}

export interface Sources {
  Time: TimeSource,
  DOM: MainDOMSource,
  JSONP: Stream<ResponseStream>,
  state: StateSource<State>;
}

export interface Sinks {
  DOM: Stream<VNode>
  preventDefault: Stream<Event>
  JSONP: Stream<string>
  state: Stream<Reducer<State>>;
}

export type State = Immutable.Map<string, any> // keys: 'suggestions' 'highlighted' 'results' 'selected'

export default function app(sources : Sources) : Sinks {
  const state$ : Stream<State> = sources.state.stream;
  
  const listLens = {
    get: (state: State) => state.get("results"),
    set: (state: State, listState: ListState) => (state.set("results", [...listState] ))
  };
  const resultListSink = isolate(ResultList, {state: listLens})(sources)
  
  const suggestionsFromResponse$ : Stream<string[]> = networking.processResponses(sources.JSONP)
  const actions   : Actions                = intent(sources.DOM, sources.Time)
  const pReducer$ : Stream<Reducer<State>> = model(suggestionsFromResponse$, actions)
  const vtree$    : MemoryStream<VNode>    = view(state$, resultListSink.DOM, sources.Time)
  const prevented$ : Stream<Event> = preventedEvents(actions, state$)
  const searchRequest$ : Stream<string> = networking.generateRequests(actions.search$)
  const reducer$ = xs.merge(resultListSink.state as Stream<Reducer<State>>, pReducer$);
  
  return {
    DOM: vtree$,
    preventDefault: prevented$,
    JSONP: searchRequest$,
    state: reducer$,
  }
}
