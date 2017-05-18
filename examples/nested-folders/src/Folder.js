import xs from 'xstream'
import isolate from '@cycle/isolate'
import {collection, pickCombine, pickMerge} from 'cycle-onionify'
import {div, button} from '@cycle/dom'
import {pick, mix} from 'cycle-onionify'

function generateKey() {
  return Number(String(Math.random()).replace(/0\.0*/, ''))
}

function intent(domSource) {
  return {
    addChild$: domSource.select('.add').events('click').mapTo(null),
    removeSelf$: domSource.select('.remove').events('click').mapTo(null),
  }
}

function model(actions) {
  const initReducer$ = xs.of(function initReducer(prevState) {
    if (typeof prevState === 'undefined') {
      return {key: 0, removable: false, children: []}
    } else {
      return prevState
    }
  })

  const addChildReducer$ = actions.addChild$
    .mapTo(function addFolderReducer(state) {
      const newChildren = state.children.concat({
        key: generateKey(),
        removable: true,
        children: [],
      })
      return {
        ...state,
        children: newChildren,
      }
    })

  const removeSelfReducer$ = actions.removeSelf$
    .mapTo(function removeSelfReducer(state) {
      return undefined
    })

  return xs.merge(initReducer$, addChildReducer$, removeSelfReducer$)
}

function keyToColor(key) {
  let hexColor = Math.floor(((key + 1) * 1000) % 16777215).toString(16)
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
      const color = keyToColor(state.key)
      return div({style: style(color)}, [
        button('.add', ['Add Folder']),
        state.removable ? button('.remove', ['Remove me']) : null,
        state.children ? div({}, childrenVDOM) : null,
      ])
    })
}

function Children(sources) {
  const folders$ = collection(Folder, sources);
  const childrenReducer$ = folders$.compose(pickMerge('onion'))
  const childrenVDOM$ = folders$.compose(pickCombine('DOM'))

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
