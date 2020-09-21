import type { Subject, ALL } from '@cycle/callbags';

export function wrapSubject<T, U>(
  f: (t: T) => U,
  subject: Subject<U>
): Subject<T> {
  return (type: ALL, data: unknown) => {
    if (type === 1) {
      subject(1, f(data as T));
    } else subject(type as any, data);
  };
}
