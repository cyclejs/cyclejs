export function httpRequest(stateStream) {
  return stateStream
    .filter(state => state.status === 'starting upload' && state.size > 0)
    .map(function request(state) {
      const data = new FormData();
      for (let i = 0; i < state.files.length; i++) {
        data.append('files', state.files[i]);
      }
      return {
        url: 'http://localhost:3003/upload',
        method: 'POST',
        category: 'fileuploads',
        send: data,
        progress: true,
      };
    });
}

export function httpResponses(httpSource) {
  const selected$ = httpSource.select('fileuploads').flatten();

  const progress$ = selected$.filter(
    resp => resp.loaded && resp.direction === 'upload'
  );

  const response$ = selected$.filter(resp => resp.status);

  return {
    progress$,
    response$,
  };
}
