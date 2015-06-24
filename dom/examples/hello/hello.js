'use strict';
var h = CycleWeb.h;

function main(ext) {
  return {
    DOM: ext.DOM.get('.myinput', 'input')
      .map(function (ev) { return ev.target.value; })
      .startWith('')
      .map(function (name) {
        return h('div', [
          h('label', 'Name:'),
          h('input.myinput', {attributes: {type: 'text'}}),
          h('hr'),
          h('h1', 'Hello ' + name)
        ]);
      })
  };
}

Cycle.run(main, {
  DOM: CycleWeb.makeDOMDriver('.js-container')
});
