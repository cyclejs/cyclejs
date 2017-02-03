let Cycle = require('@cycle/xstream-run');
let xs = require('xstream').default;
let {makeDOMDriver} = require('@cycle/dom');
let app = require('./app');

function clientSideApp(sources) {
  let sinks = app(sources);
  sinks.DOM = sinks.DOM.drop(1);
  return sinks;
}

// custom driver 
function preventDefaultDriver(ev$) {
  ev$.addListener({

    // just map 'next' to 'preventDefault'
    next: ev => ev.preventDefault(),
    error: () => {},
    complete: () => {},
  });
}

Cycle.run(clientSideApp, {
  DOM: makeDOMDriver('.app-container'),
  PreventDefault: preventDefaultDriver,

  // evaluates to stream emitting route object : Strean<Object> 
  // {route: "/"} or {route: "/about"}
  context: () => xs.of(window.appContext),
});
