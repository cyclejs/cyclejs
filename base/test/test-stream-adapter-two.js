"use strict";
var rxjs_1 = require('rxjs');
function attemptSubjectComplete(subject) {
    try {
        subject.complete();
    }
    catch (err) {
        return void 0;
    }
}
var RxJSAdapter = {
    adapt: function (originStream, originStreamSubscribe) {
        if (this.isValidStream(originStream)) {
            return originStream;
        }
        return rxjs_1.Observable.create(function (observer) {
            var dispose = originStreamSubscribe(originStream, observer);
            return function () {
                if (typeof dispose === 'function') {
                    dispose.call(null);
                }
            };
        });
    },
    makeSubject: function () {
        var stream = new rxjs_1.ReplaySubject(1);
        var observer = {
            next: function (x) { stream.next(x); },
            error: function (err) { stream.error(err); },
            complete: function (x) { stream.complete(); },
        };
        return { stream: stream, observer: observer };
    },
    isValidStream: function (stream) {
        return (typeof stream.subscribe === 'function' &&
            typeof stream.subscribeOnNext !== 'function' &&
            typeof stream.onValue !== 'function');
    },
    streamSubscribe: function (stream, observer) {
        var subscription = stream.subscribe(observer);
        return function () {
            subscription.unsubscribe();
        };
    },
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxJSAdapter;
