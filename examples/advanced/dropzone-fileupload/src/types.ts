
import {Stream} from 'xstream'
import {DOMSource, VNode} from '@cycle/dom'






interface State {
    status: string
    files: Array<File> | Array<any>
    size: number
    loaded: number
}

type Reducer = (prevState: State, message: IMessage) => State;

type Sources = {
    DOM: DOMSource,
    HTTP: any
}

type Sinks = {
    DOM: Stream<VNode>
    HTTP: any
}

interface IMessage {
    type: string
    payload: any
}

interface FileListInfo {
    files: Array<File>
    size: number
}

export {Stream, DOMSource, VNode, State, Reducer, Sources, Sinks, IMessage, FileListInfo}

