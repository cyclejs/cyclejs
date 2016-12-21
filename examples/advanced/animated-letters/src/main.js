import Cycle from '@cycle/xstream-run'
import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import fromEvent from 'xstream/extra/fromEvent'
import {div, ul, li, makeDOMDriver} from '@cycle/dom'

import {intersection, difference, sortBy} from 'lodash'

// collect lodash utilities with familiar notation
const _ = {
  intersection,
  difference,
  sortBy
}

const intent = keydownSource =>
  keydownSource

    // -> stream of key names such as 'A'
    .map(ev => ev.code.replace('Key', ''))
    .filter(str => str.length === 1)


const model = action$ => {
  const initialState = ['A']

  return action$
    .startWith(initialState)
    .fold((acc, key) => {
      const index = acc.indexOf(key)
      if (index === -1) {
        return acc.concat(key).sort()
      }
      const newAcc = acc.slice()
      newAcc.splice(index, 1)
      return newAcc
    }, [])
}


const determineDeltaPoints = state$ => 
  state$

    // https://github.com/staltz/xstream/blob/master/src/extra/pairwise.ts#L50
    // 
    // Group consecutive pairs of events as arrays
    // -> Stream<Array>
    .compose(pairwise)
    .map(([before, after]) => {

      const addedPoints = _.difference(after, before)
        .map(key =>
          ({key, value: 0, target: 1})
        )

      const removedPoints = _.difference(before, after)
        .map(key =>
          ({key, value: 1, target: 0})
        )

      const points = addedPoints.concat(removedPoints)

      return xs.fromArray(_.sortBy(points, 'key'))
    })
    .flatten()


const expandAsRenderingFrames = point$ =>
  point$.map(point =>
    xs.periodic(10)
      .mapTo(point)
      .take(100)
  )
  .flatten()


const calculateAnimationSteps = point$ => {

  function incorporateNewPoint(oldPoints, newPoint) {

    const index = oldPoints
      .findIndex(point => point.key === newPoint.key)

    let points
    if (index === -1 && newPoint.target === 1) {
      points = oldPoints.concat(newPoint)
    } else {
      points = oldPoints.slice()
      points[index] = newPoint
    }
    return points
  }

  function progressEachPoint(oldPoints, newPoints) {
    return newPoints.map(newPoint => {
      const target = newPoint.target
      const oldPoint = oldPoints.find(p => p.key === newPoint.key)
      const value = !!oldPoint 
        ? oldPoint.value 
        : newPoint.value

      return {
        ...newPoint,
        value: (Math.abs(target - value) < 0.01) 
          ? target 
          : value + (target - value) * 0.05
      }
    })
  }

  return point$.fold((acc, point) => {
    const newAcc = incorporateNewPoint(acc, point)
    const progressedAcc = progressEachPoint(acc, newAcc)
    const sanitizedAcc = progressedAcc.filter(point =>
      !(point.target === 0 && point.value === 0)
    )
    const sortedAcc = _.sortBy(sanitizedAcc, 'key')
    return sortedAcc
  }, [])
}


const animate = state$ =>
  state$
    .compose(determineDeltaPoints)
    .compose(expandAsRenderingFrames)
    .compose(calculateAnimationSteps)


function view(state$) {
  const animatedState$ = animate(state$)

  const ulStyle = {padding: '0', listStyle: 'none', display: 'flex'}
  const liStyle = {fontSize: '50px'}

  return animatedState$.map(animStates =>

    ul(
      {style: ulStyle}, 
      animStates.map(animState =>

        li(
          {style: {fontSize: `${animState.value * 50}px`}}, 
          animState.key
        )
      
      )
    )

  )}

function main(sources) {
  const key$ = intent(sources.Keydown)
  const state$ = model(key$)
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
  }
}


Cycle.run(main, {

  // https://github.com/staltz/xstream/blob/master/src/extra/fromEvent.ts#L48
  // 
  // -> stream of Keydown events
  Keydown: () => fromEvent(document, 'keydown'),
  // DOM: makeDOMDriver('#main-container'),
  DOM: makeDOMDriver(document.body),
})
