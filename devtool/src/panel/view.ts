import {Stream} from 'xstream';
import {div, h1, p, ul, a, li, pre, VNode} from '@cycle/dom';
import {devToolStyle, invalidStateStyle} from './styles';
import {DiagramState} from './model';
import {renderSpeedPicker} from './speedPicker/view';
import {renderGraph} from './graph/view';

function renderInvalidState() {
  return div(`.${invalidStateStyle}`, [
    h1('Not a Cycle.js app with xstream'),
    p('This page doesn\'t seem to be running a Cycle.js app using xstream ' +
      'as the stream library. This DevTool only supports xstream. Or maybe ' +
      'you are using xstream but an older version.'),
    p('This DevTool requires that your app is built using the following ' +
      'packages:'),
    ul([
      li([ pre('xstream'), ' v6.1.x or higher' ]),
      li([ pre('@cycle/run'), ' v3.1.x or higher' ]),
      li([ pre('@cycle/dom'), ' v12.2.x or higher, if you are using it' ]),
      li([ pre('@cycle/http'), ' v10.2.x or higher, if you are using it' ]),
    ]),
    p([
      'Need help? The ',
      a({ attrs: {
        href: 'https://gitter.im/cyclejs/cyclejs',
        target: '_blank',
      }}, 'chat'),
      ' is usually friendly and helpful.',
    ]),
  ]);
}

export default function view(diagramState$: Stream<DiagramState | null>): Stream<VNode> {
  return diagramState$
    .map(diagramState => {
      if (!diagramState) {
        return renderInvalidState();
      } else {
        const {graph, zaps, id, speed} = diagramState;
        return div(`.devTool.${devToolStyle}`, [
          renderSpeedPicker(speed),
          renderGraph(graph, zaps, id),
        ]);
      }
    });
}
