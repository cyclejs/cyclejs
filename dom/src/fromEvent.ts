import {Observable, Observer} from 'rx';

interface EventListener {
  element: Element;
  eventName: string;
  handler(ev: Event): void;
  useCapture: boolean;
}

export function fromEvent(element: Element,
                          eventName: string,
                          useCapture = false): Observable<Event> {
  return Observable.create<Event>(function subscribe(observer: Observer<Event>) {
    function next(event: Event) { observer.onNext(event); };

    element.addEventListener(eventName, next, useCapture);

    return () => element.removeEventListener(eventName, next, useCapture);

  }).share();
}
