
import xs from 'xstream'
import {DOMSource, Stream, IMessage} from './types'


export default function intent(DOM: DOMSource): Stream<IMessage> {

    const dragoverEvent$: Stream<DragEvent> = DOM
        .select('.dropzone')
        .events('dragover');

    const dragleaveEvent$: Stream<DragEvent> = DOM
        .select('.dropzone')
        .events('dragleave');

    const dragenterEvent$: Stream<DragEvent> = DOM
        .select('.dropzone')
        .events('dragenter');

    xs.merge(dragoverEvent$, dragleaveEvent$, dragenterEvent$)
        .map((ev: DragEvent) => {
            ev.preventDefault()
            return ev
        })
        .addListener({
            next: () => { },
            error: () => { },
            complete: () => { }
        })

    const dropElement = DOM.select('#file-input')


    const dropStream$ = DOM
        .select('.dropzone')
        .events('drop')
        .map(function (ev: DragEvent) {
            ev.preventDefault()
            return createMessage('dropzone-drop', ev)
        });

    const inputChange$ = DOM
        .select('#file-input')
        .events('change')
        .map((ev: any) => createMessage('dropzone-file', ev))

    const buttonStartUpload$ = DOM
        .select('#upload-button')
        .events('click')
        .map((ev: any) => createMessage('dropzone-startupload', ev))

    return xs.merge(dropStream$, inputChange$, buttonStartUpload$)
}


function createMessage(type: string, payload: any): IMessage {
    return {
        type,
        payload
    }
}