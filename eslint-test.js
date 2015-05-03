'use strict';
let Rx = require('rx');

function subscribeDispatchers(element, eventStreams) {
  if (!eventStreams || typeof eventStreams !== 'object') { return; }

  let disposables = new Rx.CompositeDisposable();
  for (let stream in eventStreams) { if (eventStreams.hasOwnProperty(stream)) {
    if (stream.endsWith('$') &&
      typeof eventStreams[stream].subscribe === 'function')
    {
      let eventName = stream.slice(0, -1);
      let disposable = eventStreams[stream].subscribe(
        makeDispatchFunction(element, eventName)
      );
      disposables.add(disposable);
    }
  }}
  return disposables;
}

module.exports = subscribeDispatchers;
