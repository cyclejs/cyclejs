import xs, {Stream, Listener} from 'xstream';
import {DevToolEnabledSource} from '@cycle/base';
import concat from 'xstream/extra/concat';
import delay from 'xstream/extra/delay';
import debounce from 'xstream/extra/debounce';
import flattenSequentially from 'xstream/extra/flattenSequentially';
import * as dagre from 'dagre';
import * as CircularJSON from 'circular-json';
import {ZapSpeed} from './panel';

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
  type: 'next' | 'error' | 'complete';
  value?: any;
}

type Size = [number, number];

const SOURCE_NODE_SIZE: Size = [23, 23];
const COMMON_NODE_SIZE: Size = [23, 23];
const SINK_NODE_SIZE: Size = [40, 30];

function zapSpeedToMilliseconds(zapSpeed: ZapSpeed): number {
  switch (zapSpeed) {
    case 'slow': return 1100;
    case 'normal': return 70;
    case 'fast': return 16;
  }
}

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
  id: Stream<string>;
  DebugSinks: Stream<Object>;
  Panel: Stream<string>;
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

function setupZapping([graph, zapSpeed]: [Dagre.Graph, ZapSpeed]): Diagram {
  const registry: ZapRegistry = new ZapRegistry();
  const sourceNodes: Array<string> = graph['sources']();
  sourceNodes.forEach(id => {
    zapVisit(id, 0, graph, registry);
  });

  const rawZap$ = xs.create<Zap>({
    start(listener: Listener<Zap>) {
      for (let i = 0, N = registry.records.length; i < N; i++) {
        const record = registry.records[i];
        const id = record.id;
        record.stream.setDebugListener({
          next: (value) => listener.next({ id, type: 'next', value } as Zap),
          error: (err) => listener.next({ id, type: 'error', value: err } as Zap),
          complete: () => listener.next({ id, type: 'complete' } as Zap),
        });
      }
    },
    stop() {}
  });

  const actualZap$ = rawZap$
    .map(zap => xs.of(zap).compose(delay<Zap>(zapSpeedToMilliseconds(zapSpeed))))
    .compose(flattenSequentially);

  const stopZap$ = actualZap$
    .mapTo(null).compose(debounce<Zap>(zapSpeedToMilliseconds(zapSpeed) * 2))
    .startWith(null);

  const zap$ = xs.merge(actualZap$, stopZap$)

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

function makeObjectifyGraph(id$: Stream<string>) {
  return function objectifyGraph(diagram$: Stream<Diagram>): Stream<Object> {
    return xs.combine(diagram$, id$)
      .map(([{graph, zap$}, id]) => {
        const object = dagre.graphlib['json'].write(graph);
        for (let i = 0, N = object.nodes.length; i < N; i++) {
          delete object.nodes[i].stream;
        }
        return zap$.map(zap => {
          object.zap = zap;
          object.id = id;
          return object;
        });
      }).flatten();
  }
}

function GraphSerializer(sources: GraphSerializerSources): GraphSerializerSinks {
  let zapSpeed$ = (sources.Panel as Stream<ZapSpeed>).startWith('normal');

  let graph$ = sources.DebugSinks
    .map(buildGraph);

  let serializedGraph$ = xs.combine(graph$, zapSpeed$)
    .map(setupZapping)
    .compose(makeObjectifyGraph(sources.id))
    .map(object => CircularJSON.stringify(object, null, '  '));

  return {
    graph: serializedGraph$,
  };
}

const panelMessage$ = xs.create<string>();
window['receivePanelMessage'] = function receivePanelMessage(msg: string) {
  panelMessage$.shamefullySendNext(msg);
}

let started: boolean = false;

function startGraphSerializer(appSinks: Object) {
  if (started) {
    return;
  }
  const serializerSources: GraphSerializerSources = {
    id: xs.of(`graph-${Math.round(Math.random()*1000000000)}`),
    DebugSinks: xs.of(appSinks),
    Panel: panelMessage$,
  };
  const serializerSinks = GraphSerializer(serializerSources);

  serializerSinks.graph.addListener({
    next: graph => {
      // console.log('GRAPH SERIALIZER send message to CONTENT SCRIPT: ' + graph);
      // Send message to the CONTENT SCRIPT
      const event = new CustomEvent('CyclejsDevToolEvent', {detail: graph});
      document.dispatchEvent(event);
    },
    error: (err: any) => {
      console.error('Cycle.js DevTool (graph serializer):\n' + err);
      console.error(err.stack);
    },
    complete: () => {},
  });
  started = true;
}

window['CyclejsDevTool_startGraphSerializer'] = startGraphSerializer;

var intervalID = setInterval(function () {
  if (window['Cyclejs'] && window['Cyclejs'].sinks) {
    clearInterval(intervalID);
    startGraphSerializer(window['Cyclejs'].sinks);
  }
}, 50);