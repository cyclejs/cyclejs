
import xs from 'xstream'
import {Stream, IMessage, State, FileListInfo} from './types'


export default function model(actionsUpdatesStream: Stream<IMessage>): Stream<State> {

    const defaultState: State = {
        status: 'click below or drag&drop files!',
        size: 0,
        loaded: 0,
        files: []
    }


    return xs
        .merge(actionsUpdatesStream)
        .startWith({ type: 'initial', payload: null })
        .fold(reducer, defaultState)
}


function reducer(acc: State, message: IMessage) {

    const { status: currentStatus, files: currentFiles, size: currentSize, loaded: currentLoaded } = acc
    const { type, payload } = message

    let status: string = currentStatus
    let files: Array<File> = new Array().concat(currentFiles)
    let loaded: number = currentLoaded
    let size: number = currentSize
    let listAndInfo: FileListInfo


    switch (type) {

        case 'dropzone-drop':
            listAndInfo = fileListTransformer(payload.dataTransfer.files)
            files = files.concat(listAndInfo.files)
            // console.log('reducer called dropzone-drop files', files)
            size += listAndInfo.size
            loaded = 0
            status = 'loaded'
            break
        case 'dropzone-file':
            listAndInfo = fileListTransformer(payload.target.files)
            files = files.concat(listAndInfo.files)
            loaded = 0
            size += listAndInfo.size
            status = 'loaded'
            // console.log('reducer called dropzone-file files', files)
            break
        case 'dropzone-startupload':
            // files = currentFiles
            status = files.length > 0 ? 'starting upload' : currentStatus
            // console.log('reducer called dropzone-startupload files', files)
            break
        case 'progress-event-upload':
            loaded = payload.loaded
            status = `uploading ${loaded}/${size}`
            // console.log('reducer called progress-event-upload', status)
            break
        case 'response-event':
            status = `${payload.statusText} ${payload.statusCode} upload completed of ${loaded}!`
            // console.log('reducer called response-event', status)
            break
        default:
        // status = currentStatus

    }

    return {
        status,
        files,
        loaded,
        size
    }
}

function fileListTransformer(fileList: FileList): FileListInfo {
    const files: Array<File> = []
    let size = 0
    for (let i = 0; i < fileList.length; i++) {
        size += fileList[i].size
        files.push(fileList[i])
    }
    return {
        size,
        files
    }
}