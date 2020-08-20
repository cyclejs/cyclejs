import {button, li, MainDOMSource} from "@cycle/dom";
import {StateSource} from "@cycle/state";
import xs, {Stream} from "xstream";
import tween from 'xstream/extra/tween';
import {
  DefinedObject,
  Result,
  resultItemDeleteButtonStyle,
  resultItemStyle
} from "./app";
import {TimeSource} from "@cycle/time/lib/cjs/src/time-source";

export type ItemState = Result

export interface ItemSources {
  Time: TimeSource,
  DOM: MainDOMSource,
  state: StateSource<ItemState>;
}

export type ItemSinks = any

interface AnimDiff {
  opacityDiff: number,
  distanceDiff: number,
}

interface AnimValue {
  opacity: number,
  distance: number,
}

function expandAsRenderingFrames(Time: TimeSource) : () => Stream<AnimDiff>{
  return function () {
    // we start from opacity:   0%, top: 50px and
    //      get to   opacity: 100%, top:  0px     in 0.5 sec (100 times, in every 5ms)
    // that means animDiff in each "take": +1%, -0.5px
       return Time.periodic(5).mapTo({opacityDiff:1 , distanceDiff:-0.5} as AnimDiff).take(100)
  }
}

function animate(state$: Stream<ItemState>, Time: TimeSource): Stream<AnimValue> {
  
  const animationVersion = false; // true/false: change between animation implementation
  if(animationVersion){
    return state$
      .compose(expandAsRenderingFrames(Time))
      .compose(calculateAnimationSteps)
  }
  else{
    const opacity$  = tween({ from: 0 , to: 100, duration: 600, ease: tween.power3.easeInOut})
    const distance$ = tween({ from: 50, to: 0  , duration: 600, ease: tween.power3.easeOut  })
    
    const animValue$ = xs.combine(opacity$, distance$).map(([opacity, distance]) => {
      return {opacity, distance} as AnimValue
    })
    return animValue$
  }
}

function calculateAnimationSteps(animDiff$: Stream<AnimDiff>) {
  return animDiff$.fold((oldAnimValue:AnimValue, animDiff) => {
    const newAnimValue : AnimValue = {
      opacity:  oldAnimValue.opacity  + animDiff.opacityDiff,
      distance: oldAnimValue.distance + animDiff.distanceDiff
    }
    return newAnimValue
  }, {opacity: 0, distance: 50} as AnimValue)
}

export function ResultItem(sources: ItemSources): ItemSinks {
  const state$: Stream<ItemState> = sources.state.stream;
  
  const deleteClick$: Stream<Event> = sources.DOM.select('.result-item-delete-button').events('click')
  const itemActions = {deleteResultItem$: deleteClick$.map(ev => parseInt(((ev.target as HTMLInputElement).dataset as DefinedObject).index))}
  
  const deleteResultReducer$ = itemActions.deleteResultItem$
    .map((deletedResultItemId: number) => function deleteResultReducer(itemState: ItemState): ItemState | undefined {
      return itemState.id === deletedResultItemId ? undefined : itemState;
    })
  
  const animValue$ : Stream<AnimValue> = animate(state$, sources.Time)
  const $vtree = xs.combine(state$, animValue$).map(([result, animValue]) =>
    li('.result-item',
      {style: resultItemStyle(animValue.opacity, animValue.distance)},
      [result.selected,
        button('.result-item-delete-button',
          {
            style: resultItemDeleteButtonStyle,
            attrs: {'data-index': result.id}
          },
          "Delete")]
    ),
  )
  
  return {
    state: deleteResultReducer$,
    DOM: $vtree
  }
}