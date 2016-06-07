import {ReplaySubject, Observable} from 'rx';

const testStreamAdapter = {
  adapt(originStream, originStreamSubscribe) {
    if (this.isValidStream(originStream)) {
      return originStream;
    }
    const destinationStream = Observable.create(destinationObserver => {
      const originObserver = {
        next: x => destinationObserver.onNext(x),
        error: e => destinationObserver.onError(e),
        complete: () => destinationObserver.onCompleted(),
      };
      const dispose = originStreamSubscribe(originStream, originObserver);
      return () => {
        if (typeof dispose === 'function') {
          dispose();
        }
      };
    });
    return destinationStream;
  },

  makeSubject() {
    const stream = new ReplaySubject(1);
    const observer = {
      next: x => stream.onNext(x),
      error: e =>  stream.onError(e),
      complete: () => stream.onCompleted(),
    };
    return {observer, stream}
  },

  isValidStream(stream) {
    return (
      typeof stream.subscribeOnNext === 'function' && // should have .subscribe
      typeof stream.onValue !== 'function'); // make sure not baconjs
  },

  streamSubscribe(stream, observer) {
    const subscription = stream.subscribe(
      x => observer.next(x),
      e => observer.error(e),
      () => observer.complete()
    );
    return () => {
      subscription.dispose();
    };
  },
};

export default testStreamAdapter;
