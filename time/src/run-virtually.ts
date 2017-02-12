require('setimmediate');

function runVirtually (scheduler, done, currentTime, setTime, timeToRunTo = null) {
  function processEvent () {
    const nextEvent = scheduler.peek();

    if (!nextEvent) {
      done();
      return;
    }

    const outOfTime = timeToRunTo && nextEvent.time >= timeToRunTo;

    if (outOfTime) {
      done();
      return;
    }

    const eventToProcess = scheduler.shiftNextEntry();

    if (eventToProcess.cancelled) {
      setImmediate(processEvent);
      return;
    }

    const time = eventToProcess.time;

    setTime(time);

    if (eventToProcess.f) {
      eventToProcess.f(eventToProcess, time, scheduler.add, currentTime);
    }

    if (eventToProcess.type === 'next') {
      eventToProcess.stream.shamefullySendNext(eventToProcess.value);
    }

    if (eventToProcess.type === 'error') {
      eventToProcess.stream.shamefullySendError(eventToProcess.error);
    }

    if (eventToProcess.type === 'complete') {
      eventToProcess.stream.shamefullySendComplete();
    }

    setImmediate(processEvent);
  }

  setImmediate(processEvent);
}

export {
  runVirtually
}
