import {Subject} from 'rx'
import {run} from '@cycle/core'
import {makeDOMDriver} from 'cycle-snabbdom'

import {createFolderComponent} from './Folder'

function main(sources) {
  const Folder = createFolderComponent({id: 0, removable: false})
  return Folder(sources)
}

run(main, {DOM: makeDOMDriver('#app')})
