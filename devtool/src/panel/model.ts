import xs, {Stream} from 'xstream';
import * as dagre from 'dagre';
import {Zap} from '../graphSerializer';
import * as CircularJSON from 'circular-json';

export interface DiagramState {
  id: string;
  graph: Dagre.Graph;
  zap: Zap;
  speed: ZapSpeed;
}

export type ZapSpeed = 'slow' | 'normal' | 'fast';

export default function model(serializedGraph$: Stream<string>, speed$: Stream<ZapSpeed>): Stream<DiagramState> {
  const graphAndStuff$ = serializedGraph$
    .map(serializedObject => CircularJSON.parse(serializedObject))
    .map(object => {
      const id: string = object.id || 'graph-0';
      const zap: Zap = object.zap || { id: 'INVALID', value: null, type: 'next' };
      object.zap = null;
      const graph: Dagre.Graph = dagre.graphlib['json'].read(object);
      return { graph, zap, id };
    });

  const diagramState$ = xs.combine(graphAndStuff$, speed$.startWith('normal' as ZapSpeed))
    .map(([{id, graph, zap}, speed]) => ({ id, graph, zap, speed } as DiagramState));

  return diagramState$;
}
