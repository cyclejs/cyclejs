import xs, {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import * as dagre from 'dagre';
import {Zap} from '../graphSerializer';
import * as CircularJSON from 'circular-json';

export interface DiagramState {
  id: string;
  graph: Dagre.Graph;
  zaps: Array<Zap>;
  speed: ZapSpeed;
}

export type ZapSpeed = 'slow' | 'normal' | 'fast';

export default function model(serializedGraph$: Stream<string>, speed$: Stream<ZapSpeed>): Stream<DiagramState> {
  const object$ = serializedGraph$
    .map(serializedObject => CircularJSON.parse(serializedObject))

  const id$ = object$
    .map(object => (object.id || 'graph-0') as string)
    .compose(dropRepeats());

  const graphAndZap$ = object$
    .map(object => {
      const id: string = object.id || 'graph-0';
      const zaps: Array<Zap> = object.zaps;
      object.zaps = null;
      const graph: Dagre.Graph = dagre.graphlib['json'].read(object);
      return { graph, zaps, id };
    });

  const sanitizedSpeed$ = xs.merge(
    speed$.startWith('normal' as ZapSpeed),
    id$.mapTo('normal' as ZapSpeed)
  );

  const diagramState$ = xs.combine(graphAndZap$, sanitizedSpeed$)
    .map(([{id, graph, zaps}, speed]) => ({ id, graph, zaps, speed } as DiagramState));

  return diagramState$;
}
