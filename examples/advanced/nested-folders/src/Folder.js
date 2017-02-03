import xs from 'xstream'
import isolate from '@cycle/isolate'
import {div, button} from '@cycle/dom'

// utility for filtering actions by type
const typeIs = string => ({type}) => type === string


const intent = (DOMSource, childAction$, selfId) =>

  // -> merge into single stream of actions Stream<Object>
  xs.merge(
    DOMSource.select('.add')
      .events('click')
      .mapTo({selfId, type: 'addChild'}),

    DOMSource.select('.remove')
      .events('click')
      .mapTo({selfId, type: 'removeSelf'}),

    // actions passed from children
    childAction$

      // -> stream of remove actions from children
      .filter(typeIs('removeSelf'))

      // -> stream of removeChild actions with the same id
      .map(action => ({...action, type: 'removeChild'}))
  )


// model takes both actions and component factory
const model = (action$, createIsolatedFolder) => {

  const addFolderUpdate$ = action$
    .filter(typeIs('addChild'))
    .map(action => 

      // for each action generate a function
      // -> (Map -> Map)
      childrenMap => {

        const childId = Math.random()
          .toString()

          // -> large integer string
          .replace('0.', '')

        const folder = createIsolatedFolder(childId)


        return childrenMap

          // update the Map with new child folder at given id
          .set(childId, folder)
      })


  const removeFolderUpdate$ = action$
    .filter(typeIs('removeChild'))
    .map(action => 

      // for each remove action generate function
      // -> (Map -> Map)
      childrenMap => {
        childrenMap.delete(action.selfId)
        return childrenMap
      })

  // -> stream of maps of children : Stream<Map>
  return xs

    // stream of update functions (Map -> Map)
    .merge(addFolderUpdate$, removeFolderUpdate$)

    // apply update functions from both streams
    // inductively to the Map,
    // starting from empty Map
    .fold((children, update) => update(children), new Map())

}


const style = backgroundColor => ({
  backgroundColor,
  padding: '0.5em',
  width: 'auto',
  border: '1px solid',
})


const makeView = (removable, color) =>
  children =>

    div({style: style(color)}, [

      button('.add', ['Add Folder']),

      removable 
        && button('.remove', ['Remove me']),

      children 
        && div(
          {}, 

          // children: Map -> array of Components
          Array.from(children.values())
            .map(child =>

              // child Component carries id and DOM vNode
              div({key: child.id}, [child.DOM])
          )
        )

    ])


const makeRandomColor = () => {
  let hexColor = Math.floor(Math.random() * 16777215)
    .toString(16)

  while (hexColor.length < 6) {
    hexColor = '0' + hexColor
  }

  return '#' + hexColor
}


const createFolderComponent = ({id, removable = true}) => {

  const Folder = sources => {

    const createFolder = childId => 

      // recursively apply to the child
      createFolderComponent(({id: childId}))(sources)

    // proxy stream to avoid circular dependency
    const proxyChildAction$ = xs.create();

    // action stream depends on child proxies 
    // rather than child action streams directly
    const action$ = intent(sources.DOM, proxyChildAction$, id)

    // -> stream of children maps : Stream<Map>
    const children$ = model(action$, createFolder)

    const color = makeRandomColor()

    const vdom$ = children$
      .map(makeView(removable, color))

    const removeSelf$ = action$
      .filter(typeIs('removeSelf'))

    const childAction$ = children$
      .map(children => {
        const childActionStreams = Array
          .from(children.values())
          .map(c => c.action$)

        return xs.merge(...childActionStreams)
      })
      .flatten()

    proxyChildAction$

      // https://github.com/staltz/xstream#-imitatetarget
      // 
      // Imitate changes current Stream to emit 
      // the same events that the other given Stream does. 
      // Needs to avoid circular dependency
      .imitate(childAction$
        .endWhen(
          removeSelf$.take(1)
        ))

    return {
      DOM: vdom$,
      action$,
      id,
    }
  }

  // -> isolated clone of the Folder component
  return isolate(Folder)
}

export {createFolderComponent}
