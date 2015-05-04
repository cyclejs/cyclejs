'use strict';

function userInterface(interactions) {
  return interactions.get('.box', 'click')
    .map(function () { return Math.round(Math.random() * 1000); })
    .startWith(135)
    .map(function (data) {
      return Cycle.h('div.box', {
        style: {
          margin: '10px',
          background: '#ececec',
          padding: '5px',
          cursor: 'pointer',
          display: 'inline-block'
        }
      }, String(data));
    });
}

Cycle.applyToDOM('.js-container1', userInterface);
Cycle.applyToDOM('.js-container2', userInterface);
