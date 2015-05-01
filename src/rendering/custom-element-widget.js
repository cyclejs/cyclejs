'use strict';
let Rx = require('rx');
let extend = require('xtend');
let {makeInteraction, render} = require('./render');

function makeDispatchFunction(element, eventName) {
  return function dispatchCustomEvent(evData) {
    //console.log('%cdispatchCustomEvent ' + eventName,
    //  'background-color: #CCCCFF; color: black');
    let event;
    try {
      event = new Event(eventName);
    } catch (err) {
      event = document.createEvent('Event');
      event.initEvent(eventName, true, true);
    }
    event.data = evData;
    element.dispatchEvent(event);
  };
}

function createContainerElement(tagName, vtreeProperties) {
  let element = document.createElement('div');
  element.id = vtreeProperties.id || '';
  let className = (vtreeProperties.className || '') +
    ' cycleCustomElement-' + tagName.toUpperCase();
  element.className = className;
  return element;
}

function warnIfVTreeHasNoKey(vtree) {
  if (typeof vtree.key === 'undefined') {
    console.warn('Missing `key` property for Cycle custom element ' + vtree.tagName);
  }
}

function isNotObservable(thing) {
  return typeof thing === 'undefined' || typeof thing.subscribe !== 'function';
}

function throwIfInvalidCustomElementDefinition(customElement) {
  let customElementType = '{vtree$: IObservable<VNode>; events?: any;}';
  if (!customElement) {
    throw new Error('Invalid type for custom element. Expected interface: ' +
      customElementType);
  }
  if (isNotObservable(customElement.vtree$)) {
    throw new Error('vtree$ must be an Observable object notifying VNode');
  }
}

function throwIfVTreeHasPropertyChildren(vtree) {
  if (typeof vtree.properties.children !== 'undefined') {
    throw new Error('Custom element should not have property `children`. This is ' +
      'reserved for children elements nested into this custom element.');
  }
}

function createWidgetClass(tagName, definitionFn, registry) {
  function ObservableWidget(vtree) {
    warnIfVTreeHasNoKey(vtree);
    throwIfVTreeHasPropertyChildren(vtree);
    this.key = vtree.key;
    this.vtree = vtree;
    this.subscriptions = null;
    this.vtreeSubject$ = null;
  }
  ObservableWidget.prototype.type = 'Widget';
  ObservableWidget.prototype.init = function init() {
    let props = extend(this.vtree.properties, {
      children: this.vtree.children
    });
    this.subscriptions = new Rx.CompositeDisposable();
    this.vtreeSubject$ = new Rx.BehaviorSubject(props);
    let rootElemProxy$ = new Rx.Subject();
    let interactions = makeInteraction(rootElemProxy$);
    let customElement = definitionFn(this.vtreeSubject$, interactions);

    throwIfInvalidCustomElementDefinition(customElement);

    let container = createContainerElement(tagName, this.vtree.properties);
    let reactiveNode = render(customElement.vtree$, container, registry);

    let events = customElement.events;
    if (events && typeof events === 'object') {
      let eventNames = Object.keys(customElement.events);
      for (let i = 0; i < eventNames.length; i++) {
        let eventName = eventNames[i];
        let event$ = customElement.events[eventNames[i]];
        if (isNotObservable(event$)) {
          throw new Error(eventName + ' must be an Observable object.');
        }
        let onNext = makeDispatchFunction(container, eventName.replace(/\$$/, ''));
        this.subscriptions.add(event$.subscribe(onNext));
      }
    }

    this.subscriptions.add(reactiveNode
      .rootElem$
      .multicast(rootElemProxy$)
      .connect());
    this.subscriptions.add(reactiveNode.connect());

    return container;
  };
  ObservableWidget.prototype.update = function update(previous) {
    this.vtreeSubject$ = previous.vtreeSubject$;
    if (this.vtreeSubject$) {
      let props = extend(this.vtree.properties, {
        children: this.vtree.children
      });
      this.vtreeSubject$.onNext(props);
    }
  };
  ObservableWidget.prototype.destroy = function destroy() {
    if (this.vtreeSubject$) {
      this.vtreeSubject$.onCompleted();
    }
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
  };

  return ObservableWidget;
}

class CustomElementsRegistry {
  constructor() {
    this.registry = {};
  }
  registerCustomElement(tagName, definitionFn) {
    if (typeof tagName !== 'string' || typeof definitionFn !== 'function') {
      throw new Error('registerCustomElement requires parameters `tagName` and ' +
        '`definitionFn`.');
    }
    tagName = tagName.toUpperCase();
    if (this.registry[tagName]) {
      throw new Error('Cannot register custom element `' + tagName + '` ' +
        'for the DOMUser because that tagName is already registered.');
    }
    this.registry[tagName] =
      createWidgetClass(tagName, definitionFn, this);
  }
}

module.exports = {
  makeDispatchFunction,
  createContainerElement,
  warnIfVTreeHasNoKey,
  createWidgetClass,
  CustomElementsRegistry
};
