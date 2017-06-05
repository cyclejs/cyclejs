require('setimmediate');

function processEvent(args: any) {
  const {scheduler, done, currentTime, setTime, timeToRunTo} = args;
  const nextEvent = scheduler.peek();
  const outOfTime = nextEvent && timeToRunTo && nextEvent.time >= timeToRunTo;

  if (!nextEvent || outOfTime) {
    done();
    return;
  }

  const eventToProcess = scheduler.shiftNextEntry();

  if (eventToProcess.cancelled) {
    setImmediate(processEvent, args);
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

  setImmediate(processEvent, args);
}

function runVirtually(
  scheduler: any,
  done: any,
  currentTime: () => number,
  setTime: any,
  timeToRunTo = 0,
) {
  const args = {scheduler, done, currentTime, setTime, timeToRunTo};

  setImmediate(processEvent, args);
}

export {runVirtually};
