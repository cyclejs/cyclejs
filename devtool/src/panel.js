import xs from 'xstream';
import {makeMermaidDriver} from 'cycle-mermaid-driver';
import {div, h1, makeDOMDriver} from '@cycle/dom';

// How to send a message from PANEL to BACKGROUND
// setTimeout(function () {
//   if (!postMessageToBackground) return;
//   postMessageToBackground(JSON.stringify({
//     tabId: chrome.devtools.inspectedWindow.tabId,
//     scriptToInject: 'graphSerializer.js'
//   }));
// }, 1000);

function Panel(sources) {
  const dsl$ = sources.DSL.map(dsl => 'graph TD;\n' + dsl);
  const vnode$ = dsl$.take(1).mapTo(
    div(h1('good'))
  ).startWith(
    div(
      h1('Loading...')
    )
  );

  return {
    Mermaid: dsl$,
    DOM: vnode$,
  }
}

function backgroundSourceDriver() {
  return xs.create({
    start: listener => {
      // alert('PANEL is setting up its dsl$ window listener')
      window.addEventListener('message', function windowMessageListener(evt) {
        // alert('PANEL got a message')
        var eventData = evt.data;
        if (typeof eventData === 'object'
        && eventData !== null
        && eventData.hasOwnProperty('__fromCyclejsDevTool')
        && eventData.__fromCyclejsDevTool) {
          // alert('PANEL got ' + JSON.stringify(eventData))
          // document.querySelector('#loading').style.visibility = 'hidden';
          listener.next(eventData.data);
        }
      });
    },
    stop: () => {},
  });
}

const mermaidDriver = makeMermaidDriver('#mermaid-container');
const domDriver = makeDOMDriver('#tools-container');

const domSinkProxy = xs.create();
const domSource = domDriver(domSinkProxy);
const dslSource = backgroundSourceDriver();

const panelSources = {DSL: dslSource, DOM: domSource};
const panelSinks = Panel(panelSources);

mermaidDriver(panelSinks.Mermaid);
domSinkProxy.imitate(panelSinks.DOM);
