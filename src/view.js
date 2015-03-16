'use strict';
let Rx = require('rx');
let DataFlowNodeWithCustomWarning = require('./data-flow-node-custom-warning');

class View extends DataFlowNodeWithCustomWarning {
  constructor(definitionFn) {
    this.type = 'View';
    super(definitionFn, 'View expects an input to have the required property ');
    View.checkVTree$(this._output);
    this._correctedVtree$ = View.getCorrectedVtree$(this._output);
  }

  get(streamName) {
    if (streamName === 'vtree$') {
      return this._correctedVtree$;
    } else if (this._output[streamName]) {
      return this._output[streamName];
    } else {
      let result = super.get(streamName);
      if (!result) {
        this._output[streamName] = new Rx.Subject();
        return this._output[streamName];
      } else {
        return result;
      }
    }
  }

  static checkVTree$(view) {
    if (!view.vtree$ || typeof view.vtree$.subscribe !== 'function') {
      throw new Error('View must define `vtree$` Observable emitting virtual ' +
        'DOM elements');
    }
  }

  static throwErrorIfNotVTree(vtree) {
    if (vtree.type !== 'VirtualNode' || vtree.tagName === 'undefined') {
      throw new Error('View `vtree$` must emit only VirtualNode instances. ' +
        'Hint: create them with Cycle.h()'
      );
    }
  }

  static getCorrectedVtree$(view) {
    let newVtree$ = view.vtree$
      .map(function (vtree) {
        if (vtree.type === 'Widget') { return vtree; }
        View.throwErrorIfNotVTree(vtree);
        return vtree;
      })
      .replay(null, 1);
    newVtree$.connect();
    return newVtree$;
  }
}

module.exports = View;
