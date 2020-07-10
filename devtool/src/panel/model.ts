import xs, {Stream} from 'xstream';
import * as dagre from 'dagre';
import {Zap} from '../graphSerializer';
import * as CircularJSON from 'circular-json';

export interface DiagramState {
  id: string;
  graph: dagre.graphlib.Graph;
  zaps: Array<Zap>;
  speed: ZapSpeed;
}

export type ZapSpeed = 'slow' | 'normal' | 'fast';

export default function model(serializedGraph$: Stream<string>,
                              speed$: Stream<ZapSpeed>): Stream<DiagramState | null> {
  const object$ = serializedGraph$
    .filter(str => str.length > 0)
    .map(serializedObject => CircularJSON.parse(serializedObject));

  const graphAndZap$ = object$
    .map(object => {
      const id: string = object.id || 'graph-0';
      const zaps: Array<Zap> = object.zaps;
      object.zaps = null;
      const graph: dagre.graphlib.Graph = dagre.graphlib['json'].read(object);
      return { graph, zaps, id };
    });

  const diagramState$ = xs.combine(graphAndZap$, speed$.startWith('normal'))
    .map(([{id, graph, zaps}, speed]) => ({ id, graph, zaps, speed } as DiagramState));

  const invalidState$ = serializedGraph$
    .filter(str => str.length === 0)
    .mapTo(null);

  return xs.merge(diagramState$, invalidState$);
}
