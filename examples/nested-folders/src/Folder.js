import {Observable, Subject} from 'rx'
const {merge} = Observable
import isolate from '@cycle/isolate'
import {div, button} from 'cycle-snabbdom'

function intent(DOMSource, childAction$, selfId) {
  return merge(
    DOMSource.select('.add').events('click')
      .map(() => ({selfId, type: 'addChild'})),

    DOMSource.select('.remove').events('click')
      .map(() => ({selfId, type: 'removeSelf'}))
      .share(),

    childAction$
      .filter(action => action.type === 'removeSelf')
      .map(action => ({...action, type: 'removeChild'}))
      .share()
  )
}

function model(action$, createIsolatedFolder) {
  const addFolderUpdate$ = action$
    .filter(({type}) => type === 'addChild')
    .map(action => function addFolderUpdate(childrenMap) {
      const childId = String(Math.random()).replace('0.', '')
      const folder = createIsolatedFolder(childId)
      return childrenMap.set(childId, folder)
    })

  const removeFolderUpdate$ = action$
    .filter(({type}) => type === 'removeChild')
    .map(action => function removeFolderUpdate(childrenMap) {
      childrenMap.delete(action.selfId)
      return childrenMap
    })

  const children$ = Observable.merge(addFolderUpdate$, removeFolderUpdate$)
    .startWith(new Map())
    .scan((children, update) => update(children))

  return children$.shareReplay(1)
}

function style(backgroundColor) {
  return {
    backgroundColor,
    padding: '2em',
    width: 'auto',
    border: '2px solid black',
  }
}

function makeRandomColor() {
  let hexColor = Math.floor(Math.random() * 16777215).toString(16)
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor
  }
  return '#' + hexColor
}

function makeView(removable, color) {
  return function view(children) {
    return div({style: style(color)}, [
      button('.add', ['Add Folder']),
      removable && button('.remove', ['Remove me']),
      children && div({}, Array.from(children.values()).map(child =>
        div({key: child.id}, [child.DOM])
      ))
    ])
  }
}


function createFolderComponent({id, removable = true}) {
  function Folder(sources) {
    function createFolder(childId) {
      return createFolderComponent(({id: childId}))(sources)
    }

    const proxyChildAction$ = new Subject()
    const action$ = intent(sources.DOM, proxyChildAction$, id)
    const children$ = model(action$, createFolder)
    const color = makeRandomColor()
    const vdom$ = children$.map(makeView(removable, color))
    const removeSelf$ = action$.filter(({type}) => type === 'removeSelf')

    const childAction$ = children$
      .map(children => merge(Array.from(children.values()).map(c => c.action$)))
      .switch()

    childAction$.takeUntil(removeSelf$).subscribe(proxyChildAction$)

    return {
      DOM: vdom$,
      action$,
      id,
    }
  }

  return isolate(Folder)
}

export {createFolderComponent}
