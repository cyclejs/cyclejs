import {
  Disposable,
  CompositeDisposable,
  Observer,
  Observable,
} from 'rx';

interface EventListener {
  element: Element;
  eventName: string;
  handler(ev: Event): void;
  useCapture: boolean;
}

interface CompositeEventListener {
  element: Element | Array<Element>;
  eventName: string;
  handler(ev: Event): void;
  useCapture: boolean;
}

function createListener({element, eventName, handler, useCapture}: EventListener) {
  if (element.addEventListener) {
    element.addEventListener(eventName, handler, useCapture);
    return Disposable.create(function removeEventListener() {
      element.removeEventListener(eventName, handler, useCapture);
    });
  }
  throw new Error(`No listener found`);
}

function createEventListener(listener: CompositeEventListener): CompositeDisposable {
  const disposables = new CompositeDisposable();

  if (Array.isArray(listener.element)) {
    const elements: Array<Element> = <Array<Element>> listener.element;
    for (let i = 0, len = elements.length; i < len; i++) {
      disposables.add(
        createEventListener({
          element: listener.element[i],
          eventName: listener.eventName,
          handler: listener.handler,
          useCapture: listener.useCapture,
        })
      );
    }
  } else if (listener.element) {
    disposables.add(createListener(<EventListener> listener));
  }
  return disposables;
}

export function fromEvent(element: Element,
                          eventName: string,
                          useCapture = false): Observable<Event> {
  return Observable.create<Event>(function subscribe(observer: Observer<Event>) {
    return createEventListener({
      element,
      eventName,
      handler: function handler(ev: Event) {
        observer.onNext(ev);
      },
      useCapture,
    });
  }).share();
}
