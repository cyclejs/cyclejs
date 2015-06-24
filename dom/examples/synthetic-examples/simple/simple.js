'use strict';

function main(ext) {
  return {
    DOM: ext.DOM.get('.box', 'click')
      .map(function () { return Math.round(Math.random() * 1000); })
      .startWith(135)
      .map(function (data) {
        return CycleWeb.h('div.box', {
          style: {
            margin: '10px',
            background: '#ececec',
            padding: '5px',
            cursor: 'pointer',
            display: 'inline-block'
          }
        }, String(data));
      })
  };
}

Cycle.run(main, {
  DOM: CycleWeb.makeDOMDriver('.js-container1')
});
Cycle.run(main, {
  DOM: CycleWeb.makeDOMDriver('.js-container2')
});
