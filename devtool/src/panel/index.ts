import xs, {Stream} from 'xstream';
import {VNode, makeDOMDriver} from '@cycle/dom';
import {DOMSource} from '@cycle/dom';
import intent from './intent';
import model, {ZapSpeed} from './model';
import view from './view';
import styles from './styles';

interface PanelSources {
  DOM: DOMSource;
  graph: Stream<string>;
}

interface PanelSinks {
  DOM: Stream<VNode>;
  zapSpeed: Stream<ZapSpeed>;
}

function Panel(sources: PanelSources): PanelSinks {
  const speed$ = intent(sources.DOM);
  const diagramState$ = model(sources.graph, speed$);
  const vdom$ = view(diagramState$).replaceError(err => {
    alert(err);
    return xs.empty();
  });

  return {
    DOM: vdom$,
    zapSpeed: speed$,
  };
}

function backgroundSourceDriver(): Stream<string> {
  return xs.create<string>({
    start: listener => {
      // alert('PANEL is setting up its window listener');
      window.addEventListener('message', function windowMessageListener(evt) {
        // alert('PANEL got a message');
        const eventData = evt.data;
        if (typeof eventData === 'object'
        && eventData !== null
        && eventData.hasOwnProperty('__fromCyclejsDevTool')
        && eventData.__fromCyclejsDevTool) {
          // alert('PANEL got ' + JSON.stringify(eventData));
          listener.next(eventData.data);
        }
      });
    },
    stop: () => {},
  });
}

const graphSource = backgroundSourceDriver();

export function startPanel(graph$: Stream<string>): void {
  const adHocContainer: Element = document.createElement('DIV');
  adHocContainer.id = '#ad-hoc-container';
  document.body.appendChild(adHocContainer);
  const domDriver = makeDOMDriver(
    document.querySelector('#tools-container') || adHocContainer,
  );

  const domSinkProxy = xs.create<VNode>();
  const domSource = domDriver(domSinkProxy);

  const panelSources = {graph: graph$, DOM: domSource};
  const panelSinks = Panel(panelSources);

  styles.inject();
  domSinkProxy.imitate(panelSinks.DOM);
  panelSinks.zapSpeed.addListener({
    next(s: ZapSpeed) {
      // alert('PANEL posting message to graph serializer: ' + s);
      window['postMessageToGraphSerializer'](s);
    },
    error(err: any) { },
    complete() { },
  });
}

startPanel(graphSource);
// alert('PANEL should be all good to go');

// alert('PANEL is starting');
// How to send a message from PANEL to BACKGROUND
// setTimeout(function () {
//   if (!postMessageToBackground) return;
//   postMessageToBackground(JSON.stringify({
//     tabId: chrome.devtools.inspectedWindow.tabId,
//     scriptToInject: 'graphSerializer.js'
//   }));
// }, 1000);
