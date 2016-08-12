import xs from 'xstream';
import delay from 'xstream/extra/delay';
import debounce from 'xstream/extra/debounce';
import flattenSequentially from 'xstream/extra/flattenSequentially';

function StreamGraph() {
  this.edges = [];
  this.nodes = new Map();
}

StreamGraph.prototype.registerNode = function registerNode(stream) {
  if (!this.nodes.has(stream)) {
    const node = {stream: stream, id: newId()};
    this.nodes.set(stream, node);
    return node;
  } else {
    return this.nodes.get(stream);
  }
}

StreamGraph.prototype.registerEdge = function registerEdge(ins, out, producer) {
  const fromNode = this.registerNode(ins);
  const toNode = this.registerNode(out);
  if (this.edges.find(e => e.from.id === fromNode.id && e.to.id === toNode.id)) {
    return;
  }
  const edge = {from: fromNode, to: toNode};
  if (producer && typeof producer.type === 'string') {
    edge.label = producer.type;
  }
  this.edges.push(edge);
};

let globalIncrementingId = 0;

function newId() {
  return globalIncrementingId++;
}

function queueForZapping(node, zapQueue) {
  zapQueue.push(node);
}

function setupZapping(zapQueue, zap$) {
  setTimeout(() => {
    zapQueue.reverse().forEach((node, i) => {
      node.stream.compose(delay(i*10)).addListener({
        next: ev => zap$.shamefullySendNext({id: node.id, type: 'next', value: ev}),
        error: err => zap$.shamefullySendNext({id: node.id, type: 'error', value: err}),
        complete: () => zap$.shamefullySendNext({id: node.id, type: 'complete'}),
      });
    });
  }, 100);
}

function visitEdge(graph, inStream, outStream, zapQueue) {
  const inStreamNode = graph.registerNode(inStream);
  queueForZapping(inStreamNode, zapQueue);
  graph.registerEdge(inStream, outStream, outStream._prod);
  traverse(graph, inStream, zapQueue);
}

function traverse(graph, outStream, zapQueue) {
  if (outStream._prod && outStream._prod.ins) {
    const inStream = outStream._prod.ins;
    visitEdge(graph, inStream, outStream, zapQueue);
  } else if (outStream._prod && outStream._prod.insArr) {
    outStream._prod.insArr.forEach(inStream => {
      visitEdge(graph, inStream, outStream, zapQueue);
    });
  }
  return graph;
}

function GraphSerializer(sources) {
  let zapQueue = [];
  let zap$ = xs.create();
  let dsl$ = sources.DebugSinks
    .map(sinks => {
      const streamGraph = new StreamGraph();
      for (let key in sinks) {
        if (sinks.hasOwnProperty(key)) {
          const node = streamGraph.registerNode(sinks[key]);
          queueForZapping(node, zapQueue);
          traverse(streamGraph, sinks[key], zapQueue);
        }
      }
      return streamGraph;
    })
    .debug(() => {
      setupZapping(zapQueue, zap$);
    })
    .map(graph =>
      graph.edges.map(e => {
        const from = e.from.id;
        const to = e.to.id;
        const label = e.label ? `|${e.label}|` : '';
        return `    ${from}(_)-->${label}${to}(_);`
      }).join('\n')
    );

  let rawVisualZap$ = zap$
    .map(zap => xs.of(zap).compose(delay(80)))
    .compose(flattenSequentially)
    .startWith(null);

  let resetVisualZap$ = rawVisualZap$.compose(debounce(120)).mapTo(null);

  let visualZap$ = xs.merge(rawVisualZap$, resetVisualZap$);

  let finalDSL$ = xs.combine(dsl$, visualZap$).map(([dsl, zap]) => {
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
    let sanitizedDsl = dsl;
    if (zap && typeof zap.value !== 'undefined') {
      sanitizedDsl = dsl.replace(
        new RegExp(`${zap.id}\\(_\\)`, 'g'),
        `${zap.id}("${typeof zap.value === 'object' ? '_' : String(zap.value)}")`
      );
    }
    return sanitizedDsl + zapStyle;
  });

  let sinks = {
    Mermaid: finalDSL$
  }
  return sinks;
}

function startGraphSerializer() {
  const serializerSources = {DebugSinks: xs.of(window.Cyclejs.sinks)};
  const serializerSinks = GraphSerializer(serializerSources);

  serializerSinks.Mermaid.addListener({
    next: mermaidDSL => {
      // console.log('GRAPH SERIALIZER send message to CONTENT SCRIPT: ' + mermaidDSL)
      // Send message to the CONTENT SCRIPT
      const event = new CustomEvent('CyclejsDevToolEvent', {detail: mermaidDSL});
      document.dispatchEvent(event);
    },
    error: () => {},
    complete: () => {},
  });
}

var intervalID = setInterval(function () {
  if (window.Cyclejs && window.Cyclejs.sinks) {
    clearInterval(intervalID);
    startGraphSerializer();
  }
}, 50);
