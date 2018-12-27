import xs from 'xstream';

import {httpResponses} from './httpHelpers';

const defaultState = {
  dragging: false,
  status: 'click below or drag&drop files!',
  size: 0,
  loaded: 0,
  files: [],
};

export default function model(actions, http) {
  const responseStreams = httpResponses(http);

  const initReducer$ = xs.of(function initReducer(prevState) {
    if (typeof prevState === 'undefined') {
      return defaultState;
    } else {
      return prevState;
    }
  });

  const droppedFiles$ = actions.dropFilesEvent$.map(function(ev) {
    const {dataTransfer} = ev;
    const filelist = dataTransfer ? dataTransfer.files : null;
    return fileListTransformer(filelist);
  });

  const formFiles$ = actions.inputFileEvent$.map(function({target}) {
    const {files} = target;
    const filelist = target ? files : null;
    return fileListTransformer(filelist);
  });

  const filesAdded$ = xs.merge(droppedFiles$, formFiles$);

  const filesAddedReducer$ = filesAdded$.map(
    ({size, files}) =>
      function filesAddedReducer(prevState) {
        const {files: prevFiles, size: prevSize, dragging} = prevState;

        return {
          ...prevState,
          files: files.concat(prevFiles),
          size: prevSize + size,
          loaded: 0,
          status: 'loaded',
          dragging: false,
        };
      }
  );

  const draggingReducer$ = actions.draggingEventMessages$.map(
    message =>
      function draggingReducer(prevState) {
        return {
          ...prevState,
          dragging: message === 'dragover' ? true : false,
        };
      }
  );

  const startUploadReducer$ = actions.startUploadEvent$.map(
    () =>
      function startUploadReducer(prevState) {
        const {files, status} = prevState;
        return {
          ...prevState,
          status: files.length > 0 ? 'starting upload' : status,
        };
      }
  );

  const httpProgressReducer$ = responseStreams.progress$.map(
    response =>
      function httpProgressReducer(prevState) {
        const {loaded} = response;
        const {size} = prevState;
        return {
          ...prevState,
          loaded,
          status: `uploading ${unitHandler(loaded)} / ${unitHandler(size)}`,
        };
      }
  );

  const httpResponseReducer$ = responseStreams.response$.map(
    response =>
      function httpProgressReducer(prevState) {
        return {
          ...prevState,
          status: `${response.status} upload completed of ${unitHandler(
            prevState.loaded
          )}`,
        };
      }
  );

  return xs.merge(
    initReducer$,
    draggingReducer$,
    filesAddedReducer$,
    startUploadReducer$,
    httpResponseReducer$,
    httpProgressReducer$
  );
}

function fileListTransformer(fileList) {
  const files = [];
  let size = 0;

  if (fileList) {
    for (let i = 0; i < fileList.length; i++) {
      size += fileList[i].size;
      files.push(fileList[i]);
    }
  }
  return {
    size,
    files,
  };
}

export function unitHandler(value) {
  const unit = value > 1000000 ? 'MB' : 'KB';

  return unit === 'MB'
    ? `${(value / 1000000).toFixed(2)} MB`
    : `${(value / 1000).toFixed(2)} KB`;
}
