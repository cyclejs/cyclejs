import CycleBase from '@cycle/base'
import streamAdapter from '@cycle/most-adapter'

const Cycle = (main, drivers) => CycleBase(main, drivers, {streamAdapter})

export function run (main, drivers) {
  return CycleBase(main, drivers, {streamAdapter}).run()
}

Cycle.run = run

export default Cycle
