import xs, {Stream} from 'xstream';
import xsSA from '@cycle/xstream-adapter';
import delay from 'xstream/extra/delay';
import {div, h1, button, span, VNode, svg, makeDOMDriver} from '@cycle/dom';
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

export type ZapSpeed = 'slow' | 'normal' | 'fast';

interface PanelSinks {
  DOM: Stream<VNode>;
  zapSpeed: Stream<ZapSpeed>;
}

const styles = FreeStyle.create();

const DIAGRAM_PADDING_H = 30;
const DIAGRAM_PADDING_V = 5;
const GRAY_DARK = '#444444';
const GRAY = '#777777';
const GRAY_LIGHT = '#CDCDCD';
const GRAY_LIGHTER = '#DDDDDD';
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
  'fill': GRAY_LIGHTER,
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

const operatorNodeStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '14',
  'fill': BLUE_DARK,
  'tspan': {
    'text-shadow': 'white 2px 2px 0, white -2px 2px 0, white -2px -2px 0, white 2px -2px 0',
  }
});

const SPEED_PICKER_HEIGHT = '22px';
const SPEED_PICKER_BUTTON_WIDTH = '35px';
const SPEED_PICKER_BUTTON_SHADOW = '0px 1px 0px 0px rgba(0,0,0,0.2)';

const speedPickerStyle = styles.registerStyle({
  'display': 'flex',
  'height': SPEED_PICKER_HEIGHT,
  'position': 'fixed',
  'background': `linear-gradient(
    to bottom,
    rgba(255,255,255,1.0) 0%,
    rgba(255,255,255,0.8) 50%,
    rgba(255,255,255,0) 100%)`,
  'padding': '5px',
  'top': '0',
  'left': '0',
  'right': '0',
});

const speedPickerLabelStyle = styles.registerStyle({
  'font-family': 'sans-serif',
  'font-size': '12px',
  'line-height': SPEED_PICKER_HEIGHT,
  'color': GRAY,
  'margin-right': '5px',
});

const speedPickerSlowStyle = styles.registerStyle({
  'background-color': GRAY_LIGHTER,
  'height': SPEED_PICKER_HEIGHT,
  'border': 'none',
  'cursor': 'pointer',
  'width': SPEED_PICKER_BUTTON_WIDTH,
  'text-align': 'center',
  'color': GRAY,
  'font-size': '16px',
  'line-height': '19px',
  'border-top-left-radius': '8px',
  'border-bottom-left-radius': '8px',
  'outline': 'none',
  'box-shadow': SPEED_PICKER_BUTTON_SHADOW,
  '&:hover': {
    'background-color': GRAY_LIGHT,
  }
});

const speedPickerNormalStyle = styles.registerStyle({
  'background-color': GRAY_LIGHTER,
  'height': SPEED_PICKER_HEIGHT,
  'border': 'none',
  'cursor': 'pointer',
  'width': SPEED_PICKER_BUTTON_WIDTH,
  'text-align': 'center',
  'color': GRAY,
  'font-size': '22px',
  'line-height': '19px',
  'margin': '0 1px',
  'outline': 'none',
  'box-shadow': SPEED_PICKER_BUTTON_SHADOW,
  '&:hover': {
    'background-color': GRAY_LIGHT,
  }
});

const speedPickerFastStyle = styles.registerStyle({
  'background-color': GRAY_LIGHTER,
  'height': SPEED_PICKER_HEIGHT,
  'border': 'none',
  'cursor': 'pointer',
  'width': SPEED_PICKER_BUTTON_WIDTH,
  'text-align': 'center',
  'color': GRAY,
  'font-size': '22px',
  'line-height': '1px',
  'border-top-right-radius': '8px',
  'border-bottom-right-radius': '8px',
  'outline': 'none',
  'box-shadow': SPEED_PICKER_BUTTON_SHADOW,
  '&:hover': {
    'background-color': GRAY_LIGHT,
  }
});

const devToolStyle = styles.registerStyle({
  'padding-top': '40px',
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
  function setTSpanContent(vnode: VNode) {
    const textElem: Element = <Element> vnode.elm;
    const tspanElem: Element = <Element> textElem.childNodes[0];
    if (label && !(isZap && zap.type === 'complete')) {
      tspanElem.innerHTML = label;
    }
  }

  return svg.text({
    class: {
      [style]: !isZap || (isZap && zap.type === 'complete'),
      [nodeLabelZapNextStyle]: isZap && zap.type === 'next',
      [nodeLabelZapErrorStyle]: isZap && zap.type === 'error',
    },
    attrs: {
      x: DIAGRAM_PADDING_H + node.x + node.width * 0.5 + 10,
      y: DIAGRAM_PADDING_V + node.y + 5,
    },
    hook: {
      insert(vnode: VNode) { setTSpanContent(vnode); },
      update(oldVNode: VNode, newVNode: VNode) { setTSpanContent(newVNode); }
    }
  }, [
    svg.tspan('')
  ]);
}

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

function renderOperatorNode(node: StreamGraphNode, zap: Zap) {
  const hook = {
    insert(vnode: VNode) {
      const textElem: Element = vnode.elm as Element;
      const tspanElem: Element = <Element> textElem.childNodes[0];
      tspanElem.setAttribute('x', String(DIAGRAM_PADDING_H + node.x - textElem.clientWidth * 0.5));
      tspanElem.setAttribute('y', String(DIAGRAM_PADDING_V + node.y + textElem.clientHeight * 0.5 - 4));
    }
  }

  return svg.text({ hook, class: {[operatorNodeStyle]: true} }, [
    svg.tspan(String(node.label))
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
          const inactiveAttrValue = rectElem.getAttribute(inactiveAttr);
          if (isZap && zap.type === 'complete') {
            rectElem.setAttribute(inactiveAttr, 'complete');
          } else if (isZap && zap.type === 'error') {
            rectElem.setAttribute(inactiveAttr, 'error');
          } else if (isZap && zap.type === 'next' && inactiveAttrValue) {
            rectElem.removeAttribute(inactiveAttr);
            rectElem.setAttribute('class', nodeZapNextStyle);
          } else if (inactiveAttrValue === 'complete') {
            rectElem.setAttribute('class', nodeInactiveCompleteStyle);
          } else if (inactiveAttrValue === 'error') {
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
  if (node.type === 'source' || node.type === 'sink') {
    return renderSourceOrSinkNode(node, zap);
  } else if (node.type === 'operator') {
    return renderOperatorNode(node, zap);
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

function renderEdgeType1(vw: Dagre.Edge, graph: Dagre.Graph): VNode {
  const edgeData: StreamGraphEdge = (<any>graph).edge(vw.v, vw.w);
  const points = edgeData.points.map(({x, y}) =>
    ({ x: x + DIAGRAM_PADDING_H, y: y + DIAGRAM_PADDING_V })
  );
  // Make arrow tail not touch origin stream
  points[0].x = points[0].x * 0.4 + points[1].x * 0.6;
  points[0].y = points[0].y * 0.4 + points[1].y * 0.6;
  const x0 = points[0].x, x1 = points[1].x, y0 = points[0].y, y1 = points[1].y;
  if (Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1)) < 6) {
    points.shift();
  }

  return svg.path({
    attrs: {
      d: `M ${points.map(({ x, y }) => `${x} ${y}`).join(' ')}`,
      fill: 'none',
      stroke: BLUE_DARK,
      'stroke-width': 1,
      'stroke-dasharray': '1,0',
    }
  });
}

function renderEdgeType2(vw: Dagre.Edge, graph: Dagre.Graph): VNode {
  const edgeData: StreamGraphEdge = (<any>graph).edge(vw.v, vw.w);
  const points = edgeData.points
    .map(({x, y}) => ({ x: x + DIAGRAM_PADDING_H, y: y + DIAGRAM_PADDING_V }));

  return svg.g([
    svg.path({
      attrs: {
        d: `M ${points.map(({ x, y }) => `${x} ${y}`).join(' ')}`,
        'marker-end': `url("#arrowhead${vw.v}-${vw.w}")`,
        fill: 'none',
        stroke: BLUE_DARK,
        'stroke-width': 1,
        'stroke-dasharray': '1,0',
      }
    }),
    renderArrowHead(vw),
  ]);
}

function renderEdge(vw: Dagre.Edge, graph: Dagre.Graph): VNode {
  const orig = graph.node(vw.v) as StreamGraphNode;
  const dest = graph.node(vw.w) as StreamGraphNode;
  if (dest.type === 'operator') {
    return renderEdgeType1(vw, graph);
  } else if (orig.type === 'operator') {
    return renderEdgeType2(vw, graph);
  }
}

function renderGraph({graph, zap, id}: DiagramState): VNode {
  const g = typeof graph['graph'] === 'function' ? graph['graph']() : {};
  const attrs = {
    width: g.width + 2 * DIAGRAM_PADDING_H + 100,
    height: g.height + 2 * DIAGRAM_PADDING_V,
  };
  return svg({ attrs, key: id }, [
    ...graph.edges().map(edge => renderEdge(edge, graph)),
    ...graph.nodes().map(id => renderNode(id, graph, zap)),
  ]);
}

function renderSpeedPicker(speed: ZapSpeed): VNode {
  const selectedStyle = {
    color: GREEN_DARK,
  };
  const slowStyle = speed === 'slow' ? selectedStyle : {};
  const normalStyle = speed === 'normal' ? selectedStyle : {};
  const fastStyle = speed === 'fast' ? selectedStyle : {};

  return div(`.speedPicker.${speedPickerStyle}`, [
    span(`.${speedPickerLabelStyle}`, 'Speed'),
    button(`.slowSpeedButton.${speedPickerSlowStyle}`, { style: slowStyle }, '\u003E'),
    button(`.normalSpeedButton.${speedPickerNormalStyle}`, { style: normalStyle }, '\u226B'),
    button(`.fastSpeedButton.${speedPickerFastStyle}`, { style: fastStyle }, '\u22D9'),
  ]);
}

function render([diagram, speed]: [DiagramState, ZapSpeed]): VNode {
  return div(`.devTool.${devToolStyle}`, [
    renderSpeedPicker(speed),
    renderGraph(diagram)
  ]);
}

interface DiagramState {
  id: string;
  graph: Dagre.Graph;
  zap: Zap;
}

const emptyZap: Zap = { id: 'INVALID', value: null, type: 'next' };

function Panel(sources: PanelSources): PanelSinks {
  const speed$ = xs.merge(
    sources.DOM.select('.slowSpeedButton').events('click').mapTo('slow' as ZapSpeed),
    sources.DOM.select('.normalSpeedButton').events('click').mapTo('normal' as ZapSpeed),
    sources.DOM.select('.fastSpeedButton').events('click').mapTo('fast' as ZapSpeed)
  );

  const diagramState$ = sources.graph
    .map(serializedObject => CircularJSON.parse(serializedObject))
    .map(object => {
      const id: string = object.id || 'graph-0';
      const zap: Zap = object.zap || emptyZap;
      object.zap = null;
      const graph: Dagre.Graph = dagre.graphlib['json'].read(object);
      return { graph, zap, id };
    });

  const vdom$ = xs.combine(diagramState$, speed$.startWith('normal' as ZapSpeed))
    .map(render);

  return {
    DOM: vdom$,
    zapSpeed: speed$,
  }
}

function backgroundSourceDriver(): Stream<string> {
  return xs.create<string>({
    start: listener => {
      // alert('PANEL is setting up its window listener');
      window.addEventListener('message', function windowMessageListener(evt) {
        // alert('PANEL got a message');
        var eventData = evt.data;
        if (typeof eventData === 'object'
        && eventData !== null
        && eventData.hasOwnProperty('__fromCyclejsDevTool')
        && eventData.__fromCyclejsDevTool) {
          // alert('PANEL got ' + JSON.stringify(eventData));
          listener.next(eventData.data);
        }
      });
    },
    stop: () => {},
  });
}

const domDriver = makeDOMDriver('#tools-container');

const domSinkProxy = xs.create<VNode>();
const domSource = domDriver(domSinkProxy, xsSA);
const graphSource = backgroundSourceDriver();

const panelSources = {graph: graphSource, DOM: domSource};
const panelSinks = Panel(panelSources);

styles.inject();
domSinkProxy.imitate(panelSinks.DOM);
panelSinks.zapSpeed.addListener({
  next(s: ZapSpeed) {
    // alert('PANEL posting message to graph serializer: ' + s);
    window['postMessageToGraphSerializer'](s);
  },
  error(err: any) { },
  complete() { },
});
// alert('PANEL should be all good to go');
