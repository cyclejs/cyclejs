import xs from 'xstream'
import isolate from '@cycle/isolate'
import {div, button} from '@cycle/dom'
import {pick, mix} from 'cycle-onionify'

function generateId() {
  return Number(String(Math.random()).replace(/0\.0*/, ''))
}

function intent(domSource) {
  const addChild$ = domSource.select('.add').events('click')
    .mapTo({type: 'addChild'})

  const removeSelf$ = domSource.select('.remove').events('click')
    .mapTo({type: 'removeSelf'})

  return xs.merge(addChild$, removeSelf$)
}

function model(action$) {
  const initReducer$ = xs.of(function initReducer(prevState) {
    if (typeof prevState === 'undefined') {
      return {id: 0, removable: false, children: []}
    } else {
      return prevState
    }
  })

  const addChildReducer$ = action$
    .filter(({type}) => type === 'addChild')
    .mapTo(function addFolderReducer(state) {
      const newChildren = state.children.concat({
        id: generateId(),
        removable: true,
        children: [],
      })
      return {
        ...state,
        children: newChildren,
      }
    })

  const removeSelfReducer$ = action$
    .filter(({type}) => type === 'removeSelf')
    .mapTo(function removeSelfReducer(state) {
      return undefined
    })

  return xs.merge(initReducer$, addChildReducer$, removeSelfReducer$)
}

function idToColor(id) {
  let hexColor = Math.floor(((id + 1) * 1000) % 16777215).toString(16)
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor
  }
  return '#' + hexColor
}

function style(backgroundColor) {
  return {
    backgroundColor,
    padding: '2em',
    width: 'auto',
    border: '2px solid black',
  }
}

function view(state$, childrenVDOM$) {
  return xs.combine(state$, childrenVDOM$)
    .map(([state, childrenVDOM]) => {
      const color = idToColor(state.id)
      return div({style: style(color)}, [
        button('.add', ['Add Folder']),
        state.removable && button('.remove', ['Remove me']),
        state.children && div({}, childrenVDOM),
      ])
    })
}

function Children(sources) {
  const array$ = sources.onion.state$

  const childrenSinks$ = array$.map(array =>
    array.map((item, index) => isolate(Folder, index)(sources))
  )

  const childrenReducer$ = childrenSinks$
    .compose(pick('onion'))
    .compose(mix(xs.merge))

  const childrenVDOM$ = childrenSinks$
    .compose(pick('DOM'))
    .compose(mix(xs.combine))

  return {
    DOM: childrenVDOM$,
    onion: childrenReducer$,
  }
}

export default function Folder(sources) {
  const childrenSinks = isolate(Children, 'children')(sources)
  const state$ = sources.onion.state$
  const action$ = intent(sources.DOM)
  const parentReducer$ = model(action$)
  const vdom$ = view(state$, childrenSinks.DOM)
  const reducer$ = xs.merge(parentReducer$, childrenSinks.onion)
  return {
    DOM: vdom$,
    onion: reducer$,
  }
}
