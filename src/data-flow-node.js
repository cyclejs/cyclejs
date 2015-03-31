'use strict';
let Rx = require('rx');
let errors = require('./errors');
let InputProxy = require('./input-proxy');
let CycleInterfaceError = errors.CycleInterfaceError;

class DataFlowNode {
  constructor(definitionFn) {
    if (arguments.length !== 1 || typeof definitionFn !== 'function') {
      throw new Error('DataFlowNode expects the definitionFn as the only argument.');
    }

    this.type = 'DataFlowNode';
    this._definitionFn = definitionFn;
    this._subscription = new Rx.CompositeDisposable();
    this._proxies = [];
    for (let i = 0; i < definitionFn.length; i++) {
      this._proxies[i] = new InputProxy();
    }
    this._wasInjected = false;
    this._output = definitionFn.apply(this, this._proxies);
    DataFlowNode._checkOutputObject(this._output);
  }

  get(streamName) {
    return this._output[streamName] || null;
  }

  inject() {
    if (this._wasInjected) {
      console.warn('DataFlowNode has already been injected an input.');
    }
    if (this._definitionFn.length !== arguments.length) {
      console.warn('The call to inject() should provide the inputs that this ' +
      'DataFlowNode expects according to its definition function.');
    }
    for (let i = 0; i < this._definitionFn.length; i++) {
      let subscription = DataFlowNode._replicateAll(arguments[i], this._proxies[i]);
      this._subscription.add(subscription);
    }
    this._wasInjected = true;
    if (arguments.length === 1) {
      return arguments[0];
    } else if (arguments.length > 1) {
      return Array.prototype.slice.call(arguments);
    } else {
      return null;
    }
  }

  dispose() {
    if (this._subscription && typeof this._subscription.dispose === 'function') {
      this._subscription.dispose();
    }
  }

  static _checkOutputObject(output) {
    if (typeof output !== 'object') {
      throw new Error('A DataFlowNode should always return an object.');
    }
  }

  static _replicateAll(input, proxy) {
    if (!input || !proxy) { return; }

    let subscriptions = new Rx.CompositeDisposable();
    for (let key in proxy.proxiedProps) { if (proxy.proxiedProps.hasOwnProperty(key)) {
      let proxiedProperty = proxy.proxiedProps[key];
      let subscription;
      if (typeof input.event$ === 'function' && proxiedProperty._hasEvent$) {
        subscription = DataFlowNode._replicateAllEvent$(input, key, proxiedProperty);
      } else if (!input.hasOwnProperty(key) && input instanceof InputProxy) {
        subscription = DataFlowNode._replicate(input.get(key), proxiedProperty);
      } else if (typeof input.get === 'function' && input.get(key) !== null) {
        subscription = DataFlowNode._replicate(input.get(key), proxiedProperty);
      } else if (typeof input === 'object' && input.hasOwnProperty(key)) {
        if (!input[key]) {
          input[key] = new Rx.Subject();
        }
        subscription = DataFlowNode._replicate(input[key], proxiedProperty);
      } else {
        throw new CycleInterfaceError('Input should have the required property ' +
          key, String(key)
        );
      }
      subscriptions.add(subscription);
    }}
    return subscriptions;
  }

  static _replicateAllEvent$(input, selector, proxyObj) {
    let subscriptions = new Rx.CompositeDisposable();
    for (let eventName in proxyObj) { if (proxyObj.hasOwnProperty(eventName)) {
      if (eventName !== '_hasEvent$') {
        let event$ = input.event$(selector, eventName);
        if (event$ !== null) {
          let subscription = DataFlowNode._replicate(event$, proxyObj[eventName]);
          subscriptions.add(subscription);
        }
      }
    }}
    return subscriptions;
  }

  static _replicate(source, subject) {
    if (typeof source === 'undefined') {
      throw new Error('Cannot replicate() if source is undefined.');
    }
    return source.subscribe(
      function replicationOnNext(x) {
        subject.onNext(x);
      },
      function replicationOnError(err) {
        subject.onError(err);
        console.error(err);
      }
    );
  }
}

module.exports = DataFlowNode;
