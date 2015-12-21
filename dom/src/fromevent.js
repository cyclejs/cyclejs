let Rx = require(`rx`)

const disposableCreate = Rx.Disposable.create
const CompositeDisposable = Rx.CompositeDisposable
const AnonymousObservable = Rx.AnonymousObservable

function createListener({element, eventName, handler, useCapture}) {
  if (element.addEventListener) {
    element.addEventListener(eventName, handler, useCapture)
    return disposableCreate(function removeEventListener() {
      element.removeEventListener(eventName, handler, useCapture)
    })
  }
  throw new Error(`No listener found`)
}

function createEventListener({element, eventName, handler, useCapture}) {
  const disposables = new CompositeDisposable()

  if (Array.isArray(element)) {
    for (let i = 0, len = element.length; i < len; i++) {
      disposables.add(
        createEventListener({
          element: element[i],
          eventName,
          handler,
          useCapture,
        })
      )
    }
  } else if (element) {
    disposables.add(createListener({element, eventName, handler, useCapture}))
  }
  return disposables
}

function fromEvent(element, eventName, useCapture = false) {
  return new AnonymousObservable(function subscribe(observer) {
    return createEventListener({
      element,
      eventName,
      handler: function handler() {
        observer.onNext(arguments[0])
      },
      useCapture,
    })
  }).share()
}

module.exports = fromEvent
