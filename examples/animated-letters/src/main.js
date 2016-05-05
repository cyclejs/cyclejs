import Cycle from '@cycle/xstream-run'
import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import fromEvent from 'xstream/extra/fromEvent'
import {div, ul, li, makeDOMDriver} from '@cycle/dom'
import {intersection, difference, sortBy} from 'lodash'

function intent(keydownSource) {
  return keydownSource
    .map(ev => ev.code.replace('Key', ''))
    .filter(str => str.length === 1)
}

function model(action$) {
  const initialState = ['A']
  return action$.startWith(initialState).fold((acc, key) => {
    const index = acc.indexOf(key)
    if (index === -1) {
      return acc.concat(key).sort()
    }
    const newAcc = acc.slice()
    newAcc.splice(index, 1)
    return newAcc
  }, [])
}

function determineDeltaPoints(state$) {
  return state$.compose(pairwise()).map(([before, after]) => {
    const addedPoints = difference(after, before).map(key =>
      ({key, value: 0, target: 1})
    )
    const removedPoints = difference(before, after).map(key =>
      ({key, value: 1, target: 0})
    )
    const points = addedPoints.concat(removedPoints)
    return xs.fromArray(sortBy(points, 'key'))
  }).flatten()
}

function expandAsRenderingFrames(point$) {
  return point$.map(point =>
    xs.periodic(10).mapTo(point).take(100)
  ).flatten()
}

function calculateAnimationSteps(point$) {
  function incorporateNewPoint(oldPoints, newPoint) {
    const index = oldPoints.findIndex(point => point.key === newPoint.key)
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
      const value = !!oldPoint ? oldPoint.value : newPoint.value
      return {
        ...newPoint,
        value: (Math.abs(target - value) < 0.01) ?
          target :
          value + (target - value) * 0.05
      }
    })
  }

  return point$.fold((acc, point) => {
    const newAcc = incorporateNewPoint(acc, point)
    const progressedAcc = progressEachPoint(acc, newAcc)
    const sanitizedAcc = progressedAcc.filter(point =>
      !(point.target === 0 && point.value === 0)
    )
    const sortedAcc = sortBy(sanitizedAcc, 'key')
    return sortedAcc
  }, [])
}

function animate(state$) {
  return state$
    .compose(determineDeltaPoints)
    .compose(expandAsRenderingFrames)
    .compose(calculateAnimationSteps)
}

function view(state$) {
  const animatedState$ = animate(state$)
  const ulStyle = {padding: '0', listStyle: 'none', display: 'flex'}
  const liStyle = {fontSize: '50px'}
  return animatedState$.map(animStates =>
    ul({style: ulStyle}, animStates.map(animState =>
      li({style: {fontSize: `${animState.value * 50}px`}}, animState.key)
    ))
  )
}

function main(sources) {
  const key$ = intent(sources.Keydown)
  const state$ = model(key$)
  const vtree$ = view(state$)
  return {
    DOM: vtree$,
  }
}

Cycle.run(main, {
  Keydown: () => fromEvent(document, 'keydown'),
  DOM: makeDOMDriver('#main-container')
})
