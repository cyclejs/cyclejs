'use strict';
var h = Cycle.h;

function app(ext) {
  return {
    dom: ext.get('dom', '.myinput', 'input')
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

Cycle.run(app, {
  dom: Cycle.makeDOMAdapter('.js-container')
});
