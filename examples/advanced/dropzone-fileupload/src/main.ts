
import { run } from '@cycle/run';
import xs from 'xstream'
import { makeHTTPDriver } from '@cycle/http';
import { makeDOMDriver} from '@cycle/dom'



// import createTableVNode from './dataTable'


import view from './view'
import intent from './intent'
import model from './model'
import {httpRequest, httpResponse} from './httpHelpers'

import {IMessage, FileListInfo,Sources, Stream, State} from './types'



// TYPES ///////////////////////////////////////////////////////////////////////////








function main(sources: Sources) {
    

    const httpResponse$ = httpResponse(sources.HTTP)
    const actions$ = intent(sources.DOM)
    const actionsUpdates$ = xs.merge(actions$, httpResponse$)
    const state$ = model(actionsUpdates$)
    const request$ = httpRequest(state$)
    const vtree$ = view(state$)
    
    return {
        DOM: vtree$,
        HTTP: request$
    }
}

const drivers = {
    HTTP: makeHTTPDriver(),
    DOM: makeDOMDriver('#main-container')
}

run(main, drivers);




