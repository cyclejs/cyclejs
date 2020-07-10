/* tslint:disable:max-file-line-count */
import xs, {Stream, Listener} from 'xstream';
import {DevToolEnabledSource} from '@cycle/run';
import debounce from 'xstream/extra/debounce';
import * as dagre from 'dagre';
import * as CircularJSON from 'circular-json';
import {ZapSpeed} from './panel/model';
import timeSpread from './utils/timeSpread';
import {SessionSettings} from './launcher';

interface InternalProducer {
  type?: string;
}

export interface StreamGraphNode {
  id: string;
  type: 'source' | 'stream' | 'sink' | 'operator';
  label?: string;
  stream: Stream<any>;
  width: number;
  height: number;
  x?: number;
  y?: number;
}

export interface StreamGraphEdge {
  label?: string;
  points?: Array<{x: number; y: number}>;
}

export interface Zap {
  id: string;
  type: 'next' | 'error' | 'complete';
  value?: any;
}

type Size = [number, number];

const OPERATOR_NODE_SIZE: Size = [23, 10];
const SOURCE_NODE_SIZE: Size = [23, 23];
const COMMON_NODE_SIZE: Size = [23, 23];
const SINK_NODE_SIZE: Size = [40, 30];

function zapSpeedToMilliseconds(zapSpeed: ZapSpeed): number {
  switch (zapSpeed) {
    case 'slow':
      return 1100;
    case 'normal':
      return 80;
    case 'fast':
      return 16;
  }
}

class IdTable {
  private mutableIncrementingId: number;
  public map: Map<Object, number>;

  constructor() {
    this.mutableIncrementingId = 0;
    this.map = new Map<Stream<any>, number>();
  }

  public getId(thing: Object): string {
    if (!this.map.has(thing)) {
      const id = this.mutableIncrementingId;
      this.map.set(thing, id);
      this.mutableIncrementingId += 1;
      return String(id);
    } else {
      return String(this.map.get(thing));
    }
  }
}

function makeSureNodeIsRegistered(
  graph: dagre.graphlib.Graph,
  idTable: IdTable,
  stream: Stream<any>,
): void {
  if (!graph.node(idTable.getId(stream))) {
    let node: StreamGraphNode;
    if (stream['_isCycleSource']) {
      node = {
        id: idTable.getId(stream),
        type: 'source',
        label: (stream as Stream<any> & DevToolEnabledSource)._isCycleSource,
        stream: stream,
        width: SOURCE_NODE_SIZE[0],
        height: SOURCE_NODE_SIZE[1],
      };
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

function visitOperator(
  graph: dagre.graphlib.Graph,
  idTable: IdTable,
  operator: InternalProducer,
): void {
  const id = idTable.getId(operator);
  if (!graph.node(id)) {
    graph.setNode(id, {
      id,
      type: 'operator',
      label: operator.type,
      width: OPERATOR_NODE_SIZE[0],
      height: OPERATOR_NODE_SIZE[1],
    });
  }
}

function visitEdge(
  graph: dagre.graphlib.Graph,
  idTable: IdTable,
  inStream: Stream<any>,
  operator: InternalProducer,
  outStream: Stream<any>,
) {
  makeSureNodeIsRegistered(graph, idTable, inStream);
  makeSureNodeIsRegistered(graph, idTable, outStream);
  graph.setEdge(idTable.getId(inStream), idTable.getId(operator), {});
  graph.setEdge(idTable.getId(operator), idTable.getId(outStream), {});
  if (!inStream['_isCycleSource']) {
    traverse(graph, idTable, inStream);
  }
}

function traverse(
  graph: dagre.graphlib.Graph,
  idTable: IdTable,
  outStream: Stream<any>,
): void {
  if (outStream._prod && outStream._prod['ins']) {
    const inStream: Stream<any> = outStream._prod['ins'];
    visitOperator(graph, idTable, outStream._prod);
    visitEdge(graph, idTable, inStream, outStream._prod, outStream);
  } else if (outStream._prod && outStream._prod['insArr']) {
    const insArr: Array<Stream<any>> = outStream._prod['insArr'];
    visitOperator(graph, idTable, outStream._prod);
    insArr.forEach(inStream => {
      visitEdge(graph, idTable, inStream, outStream._prod, outStream);
    });
  } else if (outStream._prod) {
    visitOperator(graph, idTable, outStream._prod);
    makeSureNodeIsRegistered(graph, idTable, outStream);
    graph.setEdge(idTable.getId(outStream._prod), idTable.getId(outStream), {});
  }
}

function buildGraph(sinks: Object): dagre.graphlib.Graph {
  const idTable = new IdTable();
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({nodesep: 60, ranksep: 20});
  for (const key in sinks) {
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
  graph: dagre.graphlib.Graph;
  zaps$: Stream<Array<Zap>>;
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

  public has(id: string): boolean {
    return this._presenceSet.has(id);
  }

  public register(id: string, stream: Stream<any>, depth: number): void {
    this._presenceSet.add(id);
    this._records.push({id, stream, depth});
  }

  get records() {
    return this._records;
  }
}

function setupZapping(
  [graph, zapSpeed]: [dagre.graphlib.Graph, ZapSpeed],
): Diagram {
  const registry: ZapRegistry = new ZapRegistry();
  const sourceNodes: Array<string> = graph['sources']();
  sourceNodes.forEach(id => {
    zapVisit(id, 0, graph, registry);
  });

  const rawZap$ = xs.create<Zap>({
    start(listener: Listener<Zap>) {
      const n = registry.records.length;
      for (let i = 0; i < n; i++) {
        const record = registry.records[i];
        const id = record.id;
        record.stream.setDebugListener({
          next: value => listener.next({id, type: 'next', value} as Zap),
          error: err => listener.next({id, type: 'error', value: err} as Zap),
          complete: () => listener.next({id, type: 'complete'} as Zap),
        });
      }
    },
    stop() {},
  });

  const actualZaps$ = rawZap$.compose(
    timeSpread(zapSpeedToMilliseconds(zapSpeed)),
  );

  const stopZaps$: Stream<Array<any>> = actualZaps$
    .mapTo([])
    .compose(debounce(200))
    .startWith([]);

  const zaps$ = xs.merge(actualZaps$, stopZaps$);

  return {graph, zaps$};
}

function zapVisit(
  nodeId: string,
  depth: number,
  graph: dagre.graphlib.Graph,
  registry: ZapRegistry,
) {
  if (registry.has(nodeId)) {
    return;
  } else {
    const node: StreamGraphNode = graph.node(nodeId);
    if (node.type !== 'operator') {
      registry.register(nodeId, node.stream, depth);
    }
    const successors: Array<string> = graph['successors'](nodeId);
    successors.forEach(id => {
      zapVisit(id, depth + 1, graph, registry);
    });
  }
}

function makeObjectifyGraph(id$: Stream<string>) {
  return function objectifyGraph(diagram$: Stream<Diagram>): Stream<Object> {
    return xs
      .combine(diagram$, id$)
      .map(([{graph, zaps$}, id]) => {
        const object = dagre.graphlib['json'].write(graph);
        const n = object.nodes.length;
        for (let i = 0; i < n; i++) {
          delete object.nodes[i].stream;
        }
        return zaps$.map(zaps => {
          object.zaps = zaps;
          object.id = id;
          return object;
        });
      })
      .flatten();
  };
}

function sinksAreXStream(sinks: Object | null): boolean {
  if (sinks === null) {
    return false;
  }
  for (const key in sinks) {
    if (sinks.hasOwnProperty(key)) {
      if (sinks[key] && typeof sinks[key].setDebugListener !== 'function') {
        return false;
      }
    }
  }
  return true;
}

interface GraphSerializerSources {
  id: Stream<string>;
  DebugSinks: Stream<Object | null>;
  FromPanel: Stream<string>;
  Settings: Stream<SessionSettings>;
}

interface GraphSerializerSinks {
  graph: Stream<string>;
}

function GraphSerializer(
  sources: GraphSerializerSources,
): GraphSerializerSinks {
  const zapSpeed$ = sources.Settings
    .map(settings =>
      (sources.FromPanel as Stream<ZapSpeed>).startWith(settings.zapSpeed),
    )
    .flatten();

  const graph$ = sources.DebugSinks.filter(sinksAreXStream).map(buildGraph);

  const serializedGraph$ = xs
    .combine(graph$, zapSpeed$)
    .map(setupZapping)
    .compose(makeObjectifyGraph(sources.id))
    .map(object => CircularJSON.stringify(object));

  const invalid$ = sources.DebugSinks
    .filter(x => !sinksAreXStream(x))
    .mapTo('');

  return {
    graph: xs.merge(serializedGraph$, invalid$),
  };
}

const panelMessage$ = xs.create<string>({
  start(listener: Listener<string>) {
    window['receivePanelMessage'] = function receivePanelMessage(msg: string) {
      listener.next(msg);
    };
  },
  stop() {},
});

let started = false;

function startGraphSerializer(appSinks: Object | null) {
  if (started) {
    return;
  }
  const serializerSources: GraphSerializerSources = {
    id: xs.of(`graph-${Math.round(Math.random() * 1000000000)}`),
    DebugSinks: xs.of(appSinks),
    FromPanel: panelMessage$,
    Settings: xs.of<SessionSettings>(window['CyclejsDevToolSettings']),
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

const intervalID = setInterval(function() {
  if (window['Cyclejs'] && window['Cyclejs'].sinks) {
    clearInterval(intervalID);
    startGraphSerializer(window['Cyclejs'].sinks);
  } else {
    clearInterval(intervalID);
    startGraphSerializer(null);
  }
}, 50);
/* tslint:enable:max-file-line-count */
