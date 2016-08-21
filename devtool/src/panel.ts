import xs, {Stream} from 'xstream';
import {div, h1, VNode, svg, makeDOMDriver} from '@cycle/dom';
import {DOMSource} from '@cycle/dom/xstream-typings';
import {StreamGraphNode, StreamGraphEdge, Zap} from './graphSerializer';
import * as dagre from 'dagre';
import * as FreeStyle from 'free-style';
import * as CircularJSON from 'circular-json';

// alert('PANEL is starting');
// How to send a message from PANEL to BACKGROUND
// setTimeout(function () {
//   if (!postMessageToBackground) return;
//   postMessageToBackground(JSON.stringify({
//     tabId: chrome.devtools.inspectedWindow.tabId,
//     scriptToInject: 'graphSerializer.js'
//   }));
// }, 1000);

interface PanelSources {
  DOM: DOMSource;
  graph: Stream<string>;
}

interface PanelSinks {
  DOM: Stream<VNode>;
}

const styles = FreeStyle.create();

const DIAGRAM_PADDING_H = 30;
const DIAGRAM_PADDING_V = 5;

const sourceOrSinkNodeStyle = styles.registerStyle({
  'fill': '#DDDDDD',
  'stroke': '#444444',
  'stroke-width': '1px',
  'transition': 'fill 0.8s, stroke 0.8s, stroke-width 0.8s',
});

const sourceOrSinkNodeLabelStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '14',
  'fill': '#444444',
  'opacity': '0',
  'transition': 'opacity 3s, fill 0.8s',
});

const commonNodeStyle = styles.registerStyle({
  'stroke': '#518FFF',
  'stroke-width': '1px',
  'fill': '#CDE6FF',
  'transition': 'fill 0.8s, stroke 0.8s, stroke-width 0.8s',
});

const nodeZapNextStyle = styles.registerStyle({
  'fill': '#6DFFB3',
  'stroke': '#00C194',
  'stroke-width': '3px',
});

const nodeZapErrorStyle = styles.registerStyle({
  'fill': '#FFA382',
  'stroke': '#F53800',
  'stroke-width': '3px',
});

const nodeZapCompleteStyle = styles.registerStyle({
  'fill': '#B5B5B5',
  'stroke': '#7D7D7D',
  'stroke-width': '3px',
});

const commonNodeLabelStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '14',
  'fill': '#518FFF',
  'opacity': '0',
  'transition': 'opacity 3s, fill 0.8s',
});

const nodeLabelZapStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '14',
  'fill': '#00C194',
  'opacity': '1',
});

function renderSourceOrSinkNode(node: StreamGraphNode, zap: Zap) {
  const isZap: boolean = zap.id === node.id;
  const textAttrs = {
    'font-family': 'sans-serif',
    'font-size': '14',
    'fill': '#444444',
  };
  const P = 5; // text padding
  const hook = {
    insert(vnode: VNode) {
      const gElem: Element = <Element> vnode.elm;
      const rectElem: Element = <Element> gElem.childNodes[0];
      const textElem: Element = <Element> gElem.childNodes[1];
      const tspanElem: Element = <Element> textElem.childNodes[0];
      tspanElem.setAttribute('x', String(DIAGRAM_PADDING_H + node.x - textElem.clientWidth * 0.5));
      tspanElem.setAttribute('y', String(DIAGRAM_PADDING_V + node.y + textElem.clientHeight * 0.5));
      rectElem.setAttribute('width', String(textElem.clientWidth + 2 * P));
      rectElem.setAttribute('height', String(textElem.clientHeight + 2 * P));
      rectElem.setAttribute('x', String(DIAGRAM_PADDING_H + node.x - textElem.clientWidth * 0.5 - P));
      rectElem.setAttribute('y', String(DIAGRAM_PADDING_V + node.y - textElem.clientHeight * 0.5 - P));
    }
  }

  return svg.g({ hook }, [
    svg.rect({
      hook: {
        update(oldVNode: VNode, newVNode: VNode) {
          const rectElem: Element = <Element>newVNode.elm;
          if (isZap) {
            setTimeout(() => rectElem.setAttribute('class', sourceOrSinkNodeStyle), 50);
          }
        }
      },
      class: {
        [sourceOrSinkNodeStyle]: !isZap,
        [nodeZapNextStyle]: isZap,
      },
      attrs: {
        x: node.x - node.width * 0.5 + DIAGRAM_PADDING_H,
        y: node.y - node.height * 0.5 + DIAGRAM_PADDING_V,
        rx: 9,
        ry: 9,
        width: node.width,
        height: node.height,
      }
    }),
    svg.text({ attrs: textAttrs }, [
      svg.tspan(String(node.label))
    ]),
    renderNodeLabel(node, zap, sourceOrSinkNodeLabelStyle, true)
  ]);
}

function renderNodeLabel(node: StreamGraphNode, zap: Zap, style: string, isSink: boolean): VNode {
  const isZap: boolean = zap.id === node.id;
  let label = '';
  if (isZap) {
    // MUTATION!
    if (typeof zap.value === 'object' && zap.value !== null) {
      label = zap.value.toString();
    } else if (zap.value === null) {
      label = 'null';
    } else if (typeof zap.value === 'string') {
      label = `"${zap.value}"`;
    } else {
      label = String(zap.value);
    }
  }

  return svg.text({
    class: {
      [style]: !isZap,
      [nodeLabelZapStyle]: isZap,
    },
    attrs: {
      x: DIAGRAM_PADDING_H + node.x + node.width * 0.5 + 10,
      y: DIAGRAM_PADDING_V + node.y + 5,
    },
    hook: {
      update(oldVNode: VNode, newVNode: VNode) {
        const textElem: Element = <Element> newVNode.elm;
        const tspanElem: Element = <Element> textElem.childNodes[0];
        if (label) {
          tspanElem.innerHTML = label;
        }
        if (isZap && isSink) {
          setTimeout(() => textElem.setAttribute('class', style), 50);
        }
      }
    }
  }, [
    svg.tspan('')
  ]);
}

function renderCommonNode(node: StreamGraphNode, zap: Zap): VNode {
  const isZap: boolean = zap.id === node.id;

  return svg.g([
    svg.rect({
      class: {
        [commonNodeStyle]: !isZap,
        [nodeZapNextStyle]: isZap,
      },
      attrs: {
        x: node.x - node.width * 0.5 + DIAGRAM_PADDING_H,
        y: node.y - node.height * 0.5 + DIAGRAM_PADDING_V,
        rx: 9,
        ry: 9,
        width: node.width,
        height: node.height,
      }
    }),
    renderNodeLabel(node, zap, commonNodeLabelStyle, false)
  ]);
}

function renderNode(id: string, graph: Dagre.Graph, zap: Zap): VNode {
  const node: StreamGraphNode = graph.node(id);
  if (node.type === 'source' || node.type === 'sink') {
    return renderSourceOrSinkNode(node, zap);
  } else {
    return renderCommonNode(node, zap);
  }
}

function renderArrowHead(vw: Dagre.Edge): VNode {
  return svg.defs([
    svg.marker({
      attrs: {
        id: `arrowhead${vw.v}-${vw.w}`,
        viewBox: '0 0 10 10',
        refX: '9',
        refY: '5',
        markerUnits: 'strokeWidth',
        markerWidth: '8',
        markerHeight: '6',
        orient: 'auto',
      }
    }, [
      svg.path({
        attrs: {
          d: 'M 0 0 L 10 5 L 0 10 z',
          stroke: '#518FFF',
          fill: '#518FFF',
          'stroke-width': 1,
          'stroke-dasharray': '1,0',
        }
      })
    ])
  ]);
}

function renderEdgeLabel(edgeData: StreamGraphEdge, point: { x: number, y: number }): Array<VNode> {
  const textAttrs = {
    'font-family': 'sans-serif',
    'font-size': '14',
    'fill': '#518FFF',
  };
  const tspanStyle = {
    'text-shadow': 'white 2px 2px 0, white -2px 2px 0, white -2px -2px 0, white 2px -2px 0',
  };
  const hook = {
    insert: (vnode: VNode) => {
      const textElem: Element = <Element> vnode.elm;
      const tspanElem: Element = <Element> textElem.childNodes[0];
      tspanElem.setAttribute('x', String(point.x - textElem.clientWidth * 0.5));
      tspanElem.setAttribute('y', String(point.y + textElem.clientHeight * 0.5));
    }
  }

  if (edgeData.label && typeof edgeData.label === 'string') {
    return [
      svg.text({ hook, attrs: textAttrs }, [
        svg.tspan({ style: tspanStyle },
          String(edgeData.label)
        )
      ])
    ];
  } else {
    return [];
  }
}

function renderEdge(vw: Dagre.Edge, graph: Dagre.Graph): VNode {
  const edgeData: StreamGraphEdge = (<any>graph).edge(vw.v, vw.w);
  const points = edgeData.points
    .map(({x, y}) => ({ x: x + DIAGRAM_PADDING_H, y: y + DIAGRAM_PADDING_V }));
  // Make arrow tail not touch origin stream
  points[0].y = (points[0].y + points[1].y) * 0.5;
  const isUpwards: boolean = points[0].y > points[1].y;

  return svg.g([
    svg.path({
      attrs: {
        d: `M ${points.map(({ x, y }) => `${x} ${y}`).join(' ')}`,
        'marker-end': `url("#arrowhead${vw.v}-${vw.w}")`,
        fill: 'none',
        stroke: '#518FFF',
        'stroke-width': 1,
        'stroke-dasharray': '1,0',
      }
    }),
    ...renderEdgeLabel(edgeData, points[1]),
    renderArrowHead(vw),
  ]);
}

function renderGraph({graph, zap}: DiagramState): VNode {
  const g = typeof graph['graph'] === 'function' ? graph['graph']() : {};
  const attrs = {
    width: g.width + 2 * DIAGRAM_PADDING_H + 100,
    height: g.height + 2 * DIAGRAM_PADDING_V,
  };
  return svg({ attrs }, [
    ...graph.nodes().map(id => renderNode(id, graph, zap)),
    ...graph.edges().map(edge => renderEdge(edge, graph)),
  ]);
}

interface DiagramState {
  graph: Dagre.Graph;
  zap: Zap;
}

function Panel(sources: PanelSources): PanelSinks {
  const graph$ = sources.graph
    .map(serializedObject => CircularJSON.parse(serializedObject))
    .map(object => {
      const zap: Zap = object.zap || { id: 'INVALID', value: null, type: 'next' };
      object.zap = null;
      const graph: Dagre.Graph = dagre.graphlib['json'].read(object);
      return { graph, zap };
    })
  const vnode$ = graph$
    .map(renderGraph)
    .replaceError(err => {
      alert(err);
      return null;
  })

  return {
    DOM: vnode$,
  }
}

function backgroundSourceDriver(): Stream<string> {
  return xs.create<string>({
    start: listener => {
      // alert('PANEL is setting up its dsl$ window listener')
      window.addEventListener('message', function windowMessageListener(evt) {
        // alert('PANEL got a message')
        var eventData = evt.data;
        if (typeof eventData === 'object'
        && eventData !== null
        && eventData.hasOwnProperty('__fromCyclejsDevTool')
        && eventData.__fromCyclejsDevTool) {
          // alert('PANEL got ' + JSON.stringify(eventData))
          // document.querySelector('#loading').style.visibility = 'hidden';
          listener.next(eventData.data);
        }
      });
    },
    stop: () => {},
  });
}

const domDriver = makeDOMDriver('#tools-container');

const domSinkProxy = xs.create<VNode>();
const domSource = domDriver(domSinkProxy);
const graphSource = backgroundSourceDriver();

const panelSources = {graph: graphSource, DOM: domSource};
const panelSinks = Panel(panelSources);

styles.inject();
domSinkProxy.imitate(panelSinks.DOM);
// alert('PANEL should be all good to go');
