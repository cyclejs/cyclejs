import xs, {Stream} from 'xstream';
import {div, VNode} from '@cycle/dom';
import {devToolStyle} from './styles';
import {DiagramState} from './model';
import {renderSpeedPicker} from './speedPicker/view';
import {renderGraph} from './graph/view';

export default function view(diagramState$: Stream<DiagramState>): Stream<VNode> {
  return diagramState$
    .map(({speed, graph, id, zap}) =>
      div(`.devTool.${devToolStyle}`, [
        renderSpeedPicker(speed),
        renderGraph(graph, zap, id)
      ])
    );
}