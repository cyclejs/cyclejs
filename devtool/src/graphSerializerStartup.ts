export type GraphSerializerStartAction = 'ignore' | 'show-invalid' | 'start';

export function sinksAreXStream(sinks: Object | null): boolean {
  if (sinks === null) {
    return false;
  }
  for (const key in sinks) {
    if (sinks.hasOwnProperty(key)) {
      if (sinks[key] && typeof sinks[key].setDebugListener !== 'function') {
        return false;
      }
    }
  }
  return true;
}

export function selectGraphSerializerStartAction(
  sinks: Object | null,
  started: boolean,
  showedInvalidState: boolean,
): GraphSerializerStartAction {
  if (started) {
    return 'ignore';
  }
  if (sinksAreXStream(sinks)) {
    return 'start';
  }
  return showedInvalidState ? 'ignore' : 'show-invalid';
}
