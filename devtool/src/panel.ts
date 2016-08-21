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
const GRAY_DARK = '#444444';
const GRAY = '#DDDDDD';
const GRAY_LIGHT = '#EFEFEF';
const BLUE_DARK = '#518FFF';
const BLUE_LIGHT = '#CDE6FF';
const GREEN_DARK = '#00C194';
const GREEN_LIGHT = '#6DFFB3';
const RED_DARK = '#F53800';
const RED_LIGHT = '#FFA382';
const YELLOW_DARK = '#DDAA02';
const YELLOW_LIGHT = '#FFEE6D';
const ZAP_COOL_OFF_DURATION = '0.4s';
const EVENT_COOL_OFF_DURATION = '3s';
const ZCOD = ZAP_COOL_OFF_DURATION;
const ECOD = EVENT_COOL_OFF_DURATION;

const sourceOrSinkNodeStyle = styles.registerStyle({
  'fill': GRAY,
  'stroke': GRAY_DARK,
  'stroke-width': '1px',
  'transition': `fill ${ZCOD}, stroke ${ZCOD}, stroke-width ${ZCOD}`,
});

const sourceOrSinkNodeLabelStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '14',
  'fill': GRAY_DARK,
  'opacity': '0',
  'transition': `opacity ${ECOD}, fill ${ZCOD}`,
});

const activeNodeStyle = styles.registerStyle({
  'fill': BLUE_LIGHT,
  'stroke': BLUE_DARK,
  'stroke-width': '1px',
  'transition': `fill ${ZCOD}, stroke ${ZCOD}, stroke-width ${ZCOD}`,
});

const nodeZapNextStyle = styles.registerStyle({
  'fill': GREEN_LIGHT,
  'stroke': GREEN_DARK,
  'stroke-width': '3px',
});

const nodeZapErrorStyle = styles.registerStyle({
  'fill': RED_LIGHT,
  'stroke': RED_DARK,
  'stroke-width': '3px',
});

const nodeZapCompleteStyle = styles.registerStyle({
  'fill': YELLOW_LIGHT,
  'stroke': YELLOW_DARK,
  'stroke-width': '3px',
});

const nodeInactiveErrorStyle = styles.registerStyle({
  'fill': RED_LIGHT,
  'stroke': RED_DARK,
  'stroke-width': '1px',
  'opacity': '0.4',
  'transition': `stroke-width ${ZCOD}, opacity ${ZCOD}`,
});

const nodeInactiveCompleteStyle = styles.registerStyle({
  'fill': YELLOW_LIGHT,
  'stroke': YELLOW_DARK,
  'stroke-width': '1px',
  'opacity': '0.4',
  'transition': `stroke-width ${ZCOD}, opacity ${ZCOD}`,
});

const commonNodeLabelStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '14',
  'fill': BLUE_DARK,
  'opacity': '0',
  'transition': `opacity ${ECOD}, fill ${ZCOD}`,
});

const nodeLabelZapNextStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '14',
  'fill': GREEN_DARK,
  'opacity': '1',
});

const nodeLabelZapErrorStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '14',
  'fill': RED_DARK,
  'opacity': '1',
});

const nodeLabelZapCompleteStyle = styles.registerStyle({
  'opacity': '0',
});

function renderNodeLabel(node: StreamGraphNode, zap: Zap, style: string): VNode {
  const isZap: boolean = zap.id === node.id;
  let label = '';
  if (isZap) {
    // MUTATION!
    if (Array.isArray(zap.value)) {
      const cappedArr = (zap.value as Array<any>).slice(0, 4).map(() => '\u25A1');
      if (typeof cappedArr[3] !== 'undefined') {
        cappedArr[3] = '\u22EF';
      }
      label = `[${cappedArr.join(',')}]`;
    } else if (typeof zap.value === 'object' && zap.value !== null) {
      label = '{...}'
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
      [nodeLabelZapNextStyle]: isZap && zap.type === 'next',
      [nodeLabelZapErrorStyle]: isZap && zap.type === 'error',
      [nodeLabelZapCompleteStyle]: isZap && zap.type === 'complete',
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
      }
    }
  }, [
    svg.tspan('')
  ]);
}

function renderSourceOrSinkNode(node: StreamGraphNode, zap: Zap, isSink: boolean) {
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
      class: {
        [sourceOrSinkNodeStyle]: !isZap,
        [nodeZapNextStyle]: isZap && zap.type === 'next',
        [nodeZapErrorStyle]: isZap && zap.type === 'error',
        [nodeZapCompleteStyle]: isZap && zap.type === 'complete',
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
    renderNodeLabel(node, zap, sourceOrSinkNodeLabelStyle)
  ]);
}

function renderCommonNode(node: StreamGraphNode, zap: Zap): VNode {
  const isZap: boolean = zap.id === node.id;

  return svg.g([
    svg.rect({
      class: {
        [activeNodeStyle]: !isZap,
        [nodeZapNextStyle]: isZap && zap.type === 'next',
        [nodeZapErrorStyle]: isZap && zap.type === 'error',
        [nodeZapCompleteStyle]: isZap && zap.type === 'complete',
      },
      attrs: {
        x: node.x - node.width * 0.5 + DIAGRAM_PADDING_H,
        y: node.y - node.height * 0.5 + DIAGRAM_PADDING_V,
        rx: 9,
        ry: 9,
        width: node.width,
        height: node.height,
      },
      hook: {
        update(oldVNode: VNode, newVNode: VNode) {
          const rectElem: Element = <Element>newVNode.elm;
          const inactiveAttr = 'data-inactive-state';
          if (isZap && zap.type === 'complete') {
            rectElem.setAttribute(inactiveAttr, 'complete');
          } else if (isZap && zap.type === 'error') {
            rectElem.setAttribute(inactiveAttr, 'error');
          } else if (rectElem.getAttribute(inactiveAttr) === 'complete') {
            rectElem.setAttribute('class', nodeInactiveCompleteStyle);
          } else if (rectElem.getAttribute(inactiveAttr) === 'error') {
            rectElem.setAttribute('class', nodeInactiveErrorStyle);
          }
        }
      },
    }),
    renderNodeLabel(node, zap, commonNodeLabelStyle)
  ]);
}

function renderNode(id: string, graph: Dagre.Graph, zap: Zap): VNode {
  const node: StreamGraphNode = graph.node(id);
  if (node.type === 'source') {
    return renderSourceOrSinkNode(node, zap, false);
  } else if (node.type === 'sink') {
    return renderSourceOrSinkNode(node, zap, true);
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
  points[0].x = (points[0].x + points[1].x) * 0.5;
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

function renderGraph({graph, zap, id}: DiagramState): VNode {
  const g = typeof graph['graph'] === 'function' ? graph['graph']() : {};
  const attrs = {
    width: g.width + 2 * DIAGRAM_PADDING_H + 100,
    height: g.height + 2 * DIAGRAM_PADDING_V,
  };
  return svg({ attrs, key: id }, [
    ...graph.nodes().map(id => renderNode(id, graph, zap)),
    ...graph.edges().map(edge => renderEdge(edge, graph)),
  ]);
}

interface DiagramState {
  id: string;
  graph: Dagre.Graph;
  zap: Zap;
}

const emptyZap: Zap = { id: 'INVALID', value: null, type: 'next' };

function Panel(sources: PanelSources): PanelSinks {
  const vnode$ = sources.graph
    .map(serializedObject => CircularJSON.parse(serializedObject))
    .map(object => {
      const id: string = object.id || 'graph-0';
      const zap: Zap = object.zap || emptyZap;
      object.zap = null;
      const graph: Dagre.Graph = dagre.graphlib['json'].read(object);
      return { graph, zap, id };
    })
    .map(renderGraph);

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
