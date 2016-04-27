import Cycle from '@cycle/xstream-run';
import xs from 'xstream';
import delay from 'xstream/lib/extra/delay';
import debounce from 'xstream/lib/extra/debounce';
import flattenSequentially from 'xstream/lib/extra/flattenSequentially';
import {MapOperator, FilterOperator, TakeOperator, DebugOperator, StartWithOperator} from 'xstream/lib/core';
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom';
import {makeMermaidDriver} from 'cycle-mermaid-driver';

function main(sources) {
  return {
    DOM: sources.DOM.select('.myinput').events('input')
      .map(ev => ev.target.value)
      .startWith('')
      .map(name =>
        div([
          label('Name:'),
          input('.myinput', {attrs: {type: 'text'}}),
          hr(),
          h1(`Hello ${name}`)
        ])
      )
  };
}

let {sinks, run} = Cycle(main, {
  DOM: makeDOMDriver('#main-container')
});

//==============================================================================

function newId() {
  return Math.round(Math.random()*1000);
}

function queueForZapping(node, zapQueue) {
  zapQueue.push(node);
}

function setupZapping(zapQueue, zap$) {
  setTimeout(() => {
    zapQueue.reverse().forEach((node, i) => {
      console.log(node.id);
      node.stream.compose(delay(i*10)).addListener({
        next: ev => zap$.shamefullySendNext({id: node.id, type: 'next', value: ev}),
        error: err => zap$.shamefullySendNext({id: node.id, type: 'error', value: err}),
        complete: () => zap$.shamefullySendNext({id: node.id, type: 'complete'}),
      });
    });
  }, 100);
}

function traverse(edges, node, zapQueue) {
  if (node.stream._prod && node.stream._prod.ins) {
    const parent = {id: newId(), stream: node.stream._prod.ins};
    queueForZapping(parent, zapQueue);
    const newEdge = {from: parent, to: node};
    if (node.stream._prod instanceof MapOperator) {
      newEdge.label = 'map';
    } else if (node.stream._prod instanceof StartWithOperator) {
      newEdge.label = 'startWith';
    } else if (node.stream._prod instanceof FilterOperator) {
      newEdge.label = 'filter';
    } else if (node.stream._prod instanceof DebugOperator) {
      newEdge.label = 'debug';
    } else if (node.stream._prod instanceof TakeOperator) {
      newEdge.label = 'take';
    }
    const newEdges = edges.concat(newEdge);
    return traverse(newEdges, parent, zapQueue);
  }
  return edges;
}

function dataFlowViz(sources) {
  let zapQueue = [];
  let zap$ = xs.create();
  let dsl$ = sources.DebugSinks
    .map(sinks => {
      const node = {id: newId(), stream: sinks.DOM};
      queueForZapping(node, zapQueue);
      return traverse([], node, zapQueue);
    })
    .debug(() => {
      setupZapping(zapQueue, zap$);
    })
    .map(edges =>
      'graph TD;\n' + edges.map(e =>
        `    ${e.from.id}( )-->${e.label ? `|${e.label}|` : ''}${e.to.id}( );`
      ).join('\n')
    );

  let rawVisualZap$ = zap$
    .map(zap =>
      xs.of(zap).compose(delay(80))
    )
    .compose(flattenSequentially())
    .startWith(null);

  let resetVisualZap$ = rawVisualZap$.compose(debounce(120)).mapTo(null);

  let visualZap$ = xs.merge(rawVisualZap$, resetVisualZap$);

  let finalDSL$ = xs.combine(
    (dsl, zap) => {
      const NEXT_STYLE = 'fill: #6DFFB3, stroke: #00C194, stroke-width:3px;';
      const ERROR_STYLE = 'fill: #FFA382, stroke: #F53800, stroke-width:3px;';
      const COMPLETE_STYLE = 'fill: #B5B5B5, stroke: #7D7D7D, stroke-width:3px;';
      let zapStyle = '';
      if (zap) {
        if (zap.type === 'next') {
          zapStyle = `\n    style ${zap.id} ${NEXT_STYLE}`;
        } else if (zap.type === 'error') {
          zapStyle = `\n    style ${zap.id} ${ERROR_STYLE}`;
        } else if (zap.type === 'complete') {
          zapStyle = `\n    style ${zap.id} ${COMPLETE_STYLE}`;
        }
      }
      const dslWithZapStyle = dsl + zapStyle;
      if (zap && zap.value) {
        return dsl.replace(
          new RegExp(`${zap.id}\\( \\)`, 'g'),
          `${zap.id}(${typeof zap.value === 'object' ? ' ' : zap.value})`
        ) + zapStyle;
      } else {
        return dsl + zapStyle;
      }
    },
    dsl$, visualZap$
  ).debug();

  let sinks = {
    Mermaid: finalDSL$
  }
  return sinks;
}

Cycle.run(dataFlowViz, {
  DebugSinks: () => xs.of(sinks),
  Mermaid: makeMermaidDriver('#dataflowviz-container')
});

run(); // Run the target app
