import {VNode, svg} from '@cycle/dom';
import {StreamGraphNode, StreamGraphEdge, Zap} from '../../graphSerializer';
import styles from './styles';

export const DIAGRAM_PADDING_H = 30;
export const DIAGRAM_PADDING_V = 5;

function renderNodeLabel(node: StreamGraphNode, zap: Zap | null, style: string): VNode {
  let label = '';
  if (zap) {
    // MUTATION!
    if (Array.isArray(zap.value)) {
      const cappedArr = (zap.value as Array<any>).slice(0, 4).map(() => '\u25A1');
      if (typeof cappedArr[3] !== 'undefined') {
        cappedArr[3] = '\u22EF';
      }
      label = `[${cappedArr.join(',')}]`;
    } else if (typeof zap.value === 'object' && zap.value !== null) {
      label = '{...}';
    } else if (zap.value === null) {
      label = 'null';
    } else if (typeof zap.value === 'string') {
      label = `"${zap.value}"`;
    } else {
      label = String(zap.value);
    }
  }
  function setTSpanContent(vnode: VNode) {
    const textElem = vnode.elm as Element;
    const tspanElem = textElem.childNodes[0] as Element;
    if (label && !(zap && zap.type === 'complete')) {
      tspanElem.innerHTML = label;
    }
  }

  return svg.text({
    class: {
      [style]: !zap || (zap && zap.type === 'complete'),
      [styles.nodeLabelZapNextStyle]: zap && zap.type === 'next',
      [styles.nodeLabelZapErrorStyle]: zap && zap.type === 'error',
    },
    attrs: {
      x: DIAGRAM_PADDING_H + (node.x || 0) + node.width * 0.5 + 10,
      y: DIAGRAM_PADDING_V + (node.y || 0) + 5,
    },
    hook: {
      insert(vnode: VNode) { setTSpanContent(vnode); },
      update(oldVNode: VNode, newVNode: VNode) { setTSpanContent(newVNode); },
    },
  }, [
    svg.tspan(''),
  ]);
}

function renderSourceOrSinkNode(node: StreamGraphNode, zaps: Array<Zap>) {
  const index = zaps.map(zap => zap.id).indexOf(node.id);
  const zap = index === -1 ? null : zaps[index];
  const P = 5; // text padding
  const hook = {
    insert(vnode: VNode) {
      const gElem = vnode.elm as Element;
      const rectElem = gElem.childNodes[0] as Element;
      const textElem = gElem.childNodes[1] as Element;
      const tspanElem = textElem.childNodes[0] as Element;
      tspanElem.setAttribute('x',
        String(DIAGRAM_PADDING_H + (node.x || 0) - textElem.clientWidth * 0.5 - P * 0.4),
      );
      tspanElem.setAttribute('y',
        String(DIAGRAM_PADDING_V + (node.y || 0) + textElem.clientHeight * 0.5 - P * 0.5),
      );
      rectElem.setAttribute('x',
        String(DIAGRAM_PADDING_H + (node.x || 0) - textElem.clientWidth * 0.5 - P),
      );
      rectElem.setAttribute('y',
        String(DIAGRAM_PADDING_V + (node.y || 0) - textElem.clientHeight * 0.5 - P),
      );
      rectElem.setAttribute('width', String(textElem.clientWidth + 2 * P));
      rectElem.setAttribute('height', String(textElem.clientHeight + 2 * P));
    },
  };

  return svg.g({ hook }, [
    svg.rect({
      class: {
        [styles.sourceOrSinkNodeStyle]: !zap,
        [styles.nodeZapNextStyle]: zap && zap.type === 'next',
        [styles.nodeZapErrorStyle]: zap && zap.type === 'error',
        [styles.nodeZapCompleteStyle]: zap && zap.type === 'complete',
      },
      attrs: {
        x: (node.x || 0) - node.width * 0.5 + DIAGRAM_PADDING_H,
        y: (node.y || 0) - node.height * 0.5 + DIAGRAM_PADDING_V,
        rx: 9,
        ry: 9,
        width: node.width,
        height: node.height,
      },
    }),
    svg.text({ class: { [styles.sourceOrSinkNodeNameStyle]: true } }, [
      svg.tspan(String(node.label)),
    ]),
    renderNodeLabel(node, zap, styles.sourceOrSinkNodeLabelStyle),
  ]);
}

function renderOperatorNode(node: StreamGraphNode) {
  const hook = {
    insert(vnode: VNode) {
      const textElem = vnode.elm as Element;
      const tspanElem = textElem.childNodes[0] as Element;
      tspanElem.setAttribute('x',
        String(DIAGRAM_PADDING_H + (node.x || 0) - textElem.clientWidth * 0.5),
      );
      tspanElem.setAttribute('y',
        String(DIAGRAM_PADDING_V + (node.y || 0) + textElem.clientHeight * 0.5 - 4),
      );
    },
  };

  return svg.text({ hook, class: {[styles.operatorNodeStyle]: true} }, [
    svg.tspan(String(node.label)),
  ]);
}

function renderCommonNode(node: StreamGraphNode, zaps: Array<Zap>): VNode {
  const index = zaps.map(zap => zap.id).indexOf(node.id);
  const zap = index === -1 ? null : zaps[index];

  return svg.g([
    svg.rect({
      class: {
        [styles.activeNodeStyle]: !zap,
        [styles.nodeZapNextStyle]: zap && zap.type === 'next',
        [styles.nodeZapErrorStyle]: zap && zap.type === 'error',
        [styles.nodeZapCompleteStyle]: zap && zap.type === 'complete',
      },
      attrs: {
        x: (node.x || 0) - node.width * 0.5 + DIAGRAM_PADDING_H,
        y: (node.y || 0) - node.height * 0.5 + DIAGRAM_PADDING_V,
        rx: 9,
        ry: 9,
        width: node.width,
        height: node.height,
      },
      hook: {
        update(oldVNode: VNode, newVNode: VNode) {
          const rectElem = newVNode.elm as Element;
          const inactiveAttr = 'data-inactive-state';
          const inactiveAttrValue = rectElem.getAttribute(inactiveAttr);
          if (zap && zap.type === 'complete') {
            rectElem.setAttribute(inactiveAttr, 'complete');
          } else if (zap && zap.type === 'error') {
            rectElem.setAttribute(inactiveAttr, 'error');
          } else if (zap && zap.type === 'next' && inactiveAttrValue) {
            rectElem.removeAttribute(inactiveAttr);
            rectElem.setAttribute('class', styles.nodeZapNextStyle);
          } else if (inactiveAttrValue === 'complete') {
            rectElem.setAttribute('class', styles.nodeInactiveCompleteStyle);
          } else if (inactiveAttrValue === 'error') {
            rectElem.setAttribute('class', styles.nodeInactiveErrorStyle);
          }
        },
      },
    }),
    renderNodeLabel(node, zap, styles.commonNodeLabelStyle),
  ]);
}

function renderNode(id: string, graph: dagre.graphlib.Graph, zaps: Array<Zap>): VNode {
  const node: StreamGraphNode = graph.node(id);
  if (node.type === 'source' || node.type === 'sink') {
    return renderSourceOrSinkNode(node, zaps);
  } else if (node.type === 'operator') {
    return renderOperatorNode(node);
  } else {
    return renderCommonNode(node, zaps);
  }
}

function renderArrowHead(vw: dagre.Edge): VNode {
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
      },
    }, [
      svg.path({
        class: {
          [styles.edgeArrowHeadStyle]: true,
        },
        attrs: {
          d: 'M 0 0 L 10 5 L 0 10 z',
        },
      }),
    ]),
  ]);
}

function renderEdgeType1(vw: dagre.Edge, graph: dagre.graphlib.Graph): VNode | null {
  const edgeData: StreamGraphEdge = (graph as any).edge(vw.v, vw.w);
  if (!edgeData.points) {
    return null;
  }
  const points = edgeData.points.map(({x, y}) =>
    ({ x: x + DIAGRAM_PADDING_H, y: y + DIAGRAM_PADDING_V }),
  );
  // Make arrow tail not touch origin stream
  points[0].x = points[0].x * 0.4 + points[1].x * 0.6;
  points[0].y = points[0].y * 0.4 + points[1].y * 0.6;
  const x0 = points[0].x, x1 = points[1].x, y0 = points[0].y, y1 = points[1].y;
  if (Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1)) < 6) {
    points.shift();
  }

  return svg.path({
    class: {
      [styles.edgeType1Style]: true,
    },
    attrs: {
      d: `M ${points.map(({ x, y }) => `${x} ${y}`).join(' ')}`,
    },
  });
}

function renderEdgeType2(vw: dagre.Edge, graph: dagre.graphlib.Graph): VNode | null {
  const edgeData: StreamGraphEdge = (graph as any).edge(vw.v, vw.w);
  if (!edgeData.points) {
    return null;
  }
  const points = edgeData.points
    .map(({x, y}) => ({ x: x + DIAGRAM_PADDING_H, y: y + DIAGRAM_PADDING_V }));

  return svg.g([
    svg.path({
      class: {
        [styles.edgeType2Style]: true,
      },
      attrs: {
        d: `M ${points.map(({ x, y }) => `${x} ${y}`).join(' ')}`,
        'marker-end': `url("#arrowhead${vw.v}-${vw.w}")`,
      },
    }),
    renderArrowHead(vw),
  ]);
}

function renderEdge(vw: dagre.Edge, graph: dagre.graphlib.Graph): VNode | null {
  const orig = graph.node(vw.v) as StreamGraphNode;
  const dest = graph.node(vw.w) as StreamGraphNode;
  if (dest.type === 'operator') {
    return renderEdgeType1(vw, graph);
  } else if (orig.type === 'operator') {
    return renderEdgeType2(vw, graph);
  } else {
    return null;
  }
}

export function renderGraph(graph: dagre.graphlib.Graph, zaps: Array<Zap>, id: string): VNode {
  const g = typeof graph['graph'] === 'function' ? graph['graph']() : {};
  const attrs = {
    width: g.width + 2 * DIAGRAM_PADDING_H + 100,
    height: g.height + 2 * DIAGRAM_PADDING_V,
  };
  return svg({ attrs, key: id }, [
    ...graph.edges().map(edge => renderEdge(edge, graph)),
    ...graph.nodes().map(identifier => renderNode(identifier, graph, zaps)),
  ]);
}
