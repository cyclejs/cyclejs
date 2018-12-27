import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
export default function intent(DOM) {
  const dragoverEvent$ = DOM.select('#droparea').events('dragover');

  const dragleaveEvent$ = DOM.select('#droparea').events('dragleave');

  const dragenterEvent$ = DOM.select('#droparea').events('dragenter');

  const dropFilesEvent$ = DOM.select('#droparea').events('drop');

  const inputFileEvent$ = DOM.select('#form-file-input').events('change');

  const startUploadEvent$ = DOM.select('#upload-button').events('click');

  const dragoverMessage$ = dragoverEvent$.mapTo('dragover');
  const dragleaveMessage$ = dragleaveEvent$.mapTo('dragleave');

  const draggingEventMessages$ = xs
    .merge(dragleaveMessage$, dragoverMessage$)
    .compose(dropRepeats());

  const preventDefault$ = xs.merge(
    dragoverEvent$,
    dragleaveEvent$,
    dragenterEvent$,
    dropFilesEvent$
  );

  return {
    draggingEventMessages$,
    dropFilesEvent$,
    inputFileEvent$,
    startUploadEvent$,
    preventDefault$,
  };
}
