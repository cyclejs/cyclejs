import { table, tr, td, VNode, div, button, progress, input, span } from '@cycle/dom'


import {Stream, State} from './types'



export default function view(stateStream: Stream<State>): Stream<VNode> {
    return stateStream
        .map((state: State) =>
            div('.dropzone', [
                div('.status', [span(`Status: ${state.status}`)]),
                div('#dropzone.file-upload', [
                    input('#file-input.input-file-area', { attrs: { type: 'file', name: 'files' } }),
                    // button('#file-select.btn', ['select files']),
                    div('.uploading-files', [
                        // progress({ attrs: { value: state.loaded, max: state.size } }),
                        createTableVNode(state.files, state),
                    ])
                ]),
            ]));
}





function createTableVNode(rows: Array<File>, state: any): VNode {

    const tableRows: Array<VNode> = rows.map((item: File) => {
        const { name, type, size } = item
        return tr('.table-row', [
            td('.table-data', name),
            // td('.table-data', type),
            // td('.table-data', size),
        ])
    })

    return rows.length > 0 ? div([
        table('.table', tableRows),
        progress({ attrs: { value: state.loaded, max: state.size } }),
        button('#upload-button', ['upload files'])
    ]) : div([table('.table', tableRows)])

}