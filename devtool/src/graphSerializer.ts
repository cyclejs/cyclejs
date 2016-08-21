import xs, {Stream} from 'xstream';
import {DevToolEnabledSource} from '@cycle/base';
import concat from 'xstream/extra/concat';
import delay from 'xstream/extra/delay';
import * as dagre from 'dagre';

interface InternalProducer {
  type?: string;
}

export interface StreamGraphNode {
  id: string;
  type: 'source' | 'stream' | 'sink';
  label?: string;
  stream?: Stream<any>;
  width: number;
  height: number;
  x?: number;
  y?: number;
}

export interface StreamGraphEdge {
  label?: string;
  points?: Array<{ x: number, y: number }>;
}

export interface Zap {
  id: string;
  type: string;
  value?: any;
}

type Size = [number, number];

const SOURCE_NODE_SIZE: Size = [23, 23];
const COMMON_NODE_SIZE: Size = [23, 23];
const SINK_NODE_SIZE: Size = [40, 30];

const ZAP_INTERVAL = 70; // milliseconds, time between zapping of neighbor nodes

class StreamIdTable {
  private mutableIncrementingId: number;
  public map: Map<Stream<any>, number>;

  constructor() {
    this.mutableIncrementingId = 0;
    this.map = new Map<Stream<any>, number>();
  }

  getId(stream: Stream<any>): string {
    if (!this.map.has(stream)) {
      const id = this.mutableIncrementingId;
      this.map.set(stream, id);
      this.mutableIncrementingId += 1;
      return String(id);
    } else {
      return String(this.map.get(stream));
    }
  }
}

function makeSureNodeIsRegistered(graph: Dagre.Graph, idTable: StreamIdTable, stream: Stream<any>) {
  if (!graph.node(idTable.getId(stream))) {
    let node: StreamGraphNode;
    if (stream['_isCycleSource']) {
      node = {
        id: idTable.getId(stream),
        type: 'source',
        label: (<DevToolEnabledSource & Stream<any>> stream)._isCycleSource,
        stream: stream,
        width: SOURCE_NODE_SIZE[0],
        height: SOURCE_NODE_SIZE[1],
      }
    } else {
      node = {
        id: idTable.getId(stream),
        type: 'stream',
        stream: stream,
        width: COMMON_NODE_SIZE[0],
        height: COMMON_NODE_SIZE[1],
      };
    }
    graph.setNode(idTable.getId(stream), node);
  }
}

function visitEdge(graph: Dagre.Graph, idTable: StreamIdTable, inStream: Stream<any>, outStream: Stream<any>) {
  makeSureNodeIsRegistered(graph, idTable, inStream);
  makeSureNodeIsRegistered(graph, idTable, outStream);
  let label: string = '';
  if (outStream._prod && typeof (<InternalProducer> outStream._prod).type === 'string') {
    label = (<InternalProducer> outStream._prod).type;
  }
  graph.setEdge(idTable.getId(inStream), idTable.getId(outStream), {label});
  if (!inStream['_isCycleSource']) {
    traverse(graph, idTable, inStream);
  }
}

function traverse(graph: Dagre.Graph, idTable: StreamIdTable, outStream: Stream<any>) {
  if (outStream._prod && outStream._prod['ins']) {
    const inStream: Stream<any> = outStream._prod['ins'];
    visitEdge(graph, idTable, inStream, outStream);
  } else if (outStream._prod && outStream._prod['insArr']) {
    const insArr: Array<Stream<any>> = outStream._prod['insArr'];
    insArr.forEach(inStream => {
      visitEdge(graph, idTable, inStream, outStream);
    });
  }
}

interface GraphSerializerSources {
  DebugSinks: Stream<Object>;
}

interface GraphSerializerSinks {
  graph: Stream<string>;
}

function buildGraph(sinks: Object): Dagre.Graph {
  const idTable = new StreamIdTable();
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({});
  for (let key in sinks) {
    if (sinks.hasOwnProperty(key)) {
      const node: StreamGraphNode = {
        id: idTable.getId(sinks[key]),
        label: key,
        type: 'sink',
        stream: sinks[key],
        width: SINK_NODE_SIZE[0],
        height: SINK_NODE_SIZE[1],
      };
      graph.setNode(idTable.getId(sinks[key]), node);
      traverse(graph, idTable, sinks[key]);
    }
  }
  dagre.layout(graph);
  return graph;
}

interface Diagram {
  graph: Dagre.Graph;
  zap$: Stream<Zap>;
}

interface ZapRecord {
  id: string;
  stream: Stream<any>;
  depth: number;
}

class ZapRegistry {
  private _presenceSet: Set<string>;
  private _records: Array<ZapRecord>;

  constructor() {
    this._presenceSet = new Set<string>();
    this._records = [];
  }

  has(id: string): boolean {
    return this._presenceSet.has(id);
  }

  register(id: string, stream: Stream<any>, depth: number): void {
    this._presenceSet.add(id);
    this._records.push({ id, stream, depth });
  }

  get records() {
    return this._records;
  }
}

function setupZapping(graph: Dagre.Graph): Diagram {
  const registry: ZapRegistry = new ZapRegistry();
  const sourceNodes: Array<string> = graph['sources']();
  sourceNodes.forEach(id => {
    zapVisit(id, 0, graph, registry);
  });

  const streams: Array<Stream<any>> = registry.records.map(record =>
    record.stream.compose(delay(record.depth * ZAP_INTERVAL))
      // next
      .map(val => ({ id: record.id, type: 'next', value: val }))
      // error
      .replaceError(err => xs.of(({ id: record.id, type: 'error', value: err })))
      // complete
      .compose(s => concat(s, xs.of({ id: record.id, type: 'complete' })))
  );

  const zap$ = xs.merge(...streams).startWith(null);

  return { graph, zap$ };
}

function zapVisit(nodeId: string, depth: number, graph: Dagre.Graph, registry: ZapRegistry) {
  if (registry.has(nodeId)) {
    return;
  } else {
    const node: StreamGraphNode = graph.node(nodeId);
    registry.register(nodeId, node.stream, depth);
    const successors: Array<string> = graph['successors'](nodeId);
    successors.forEach(id => {
      zapVisit(id, depth + 1, graph, registry);
    });
  }
}

function removeStreamsFromNodes({graph, zap$}: Diagram): Diagram {
  const nodeIds = graph.nodes();
  for (let i = 0, N = nodeIds.length; i < N; i++) {
    delete (<StreamGraphNode>graph.node(nodeIds[i])).stream;
  }
  return {graph, zap$};
}

function objectifyGraph(diagram$: Stream<Diagram>): Stream<Object> {
  return diagram$.map(({graph, zap$}) => {
    const object = dagre.graphlib['json'].write(graph);
    return zap$.map(zap => {
      object.zap = zap;
      return object;
    });
  }).flatten();
}

function GraphSerializer(sources: GraphSerializerSources): GraphSerializerSinks {
  let serializedGraph$ = sources.DebugSinks
    .map(buildGraph)
    .map(setupZapping)
    .map(removeStreamsFromNodes)
    .compose(objectifyGraph)
    .map(object => JSON.stringify(object, null, '  '));

  return {
    graph: serializedGraph$,
  };
}

function startGraphSerializer(appSinks: Object) {
  const serializerSources = {DebugSinks: xs.of(appSinks)};
  const serializerSinks = GraphSerializer(serializerSources);

  serializerSinks.graph.addListener({
    next: graph => {
      // console.log('GRAPH SERIALIZER send message to CONTENT SCRIPT: ' + graph);
      // Send message to the CONTENT SCRIPT
      const event = new CustomEvent('CyclejsDevToolEvent', {detail: graph});
      document.dispatchEvent(event);
    },
    error: (err: any) => {
      console.error('Cycle.js DevTool (graph serializer): ' + err);
    },
    complete: () => {},
  });
}

var intervalID = setInterval(function () {
  if (window['Cyclejs'] && window['Cyclejs'].sinks) {
    clearInterval(intervalID);
    startGraphSerializer(window['Cyclejs'].sinks);
  }
}, 50);