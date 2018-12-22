
import xs from 'xstream'
import {Stream, State, IMessage} from './types'

// HTTP Stuff here
export function httpRequest(stateStream: Stream<State>): Stream<any> {
    return stateStream.filter((state: State) => state.status === 'starting upload' && state.size > 0)
        .map(function (state) {
            const data = new FormData()
            for (let i = 0; i < state.files.length; i++) {
                data.append('files', state.files[i])
            }
            return {
                url: 'http://localhost:3003/upload',
                method: 'POST',
                category: 'fileuploads',
                send: data,
                progress: true
            }
        })
}


export function httpResponse(httpSource: any): Stream<IMessage> {

    const httpResponseRaw$: Stream<IMessage> = httpSource.select('fileuploads').flatten()

    const httpResponseUploadProgress$ = httpResponseRaw$
        .filter((resp: any) => (resp.loaded && resp.direction === 'upload'))
        .map((resp: any) => createMessage('progress-event-upload', resp))

    const httpResponseOk$ = httpResponseRaw$
        .filter((resp: any) => resp.statusCode)
        .map((resp: any) => createMessage('response-event', resp))

    return xs.merge(httpResponseUploadProgress$, httpResponseOk$)
}


function createMessage(type: string, payload: any): IMessage {
    return {
        type,
        payload
    }
}

