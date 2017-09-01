import { svg, VNode } from '@cycle/dom';
import { NO_SPACING, Spacing, StreamGraphEdge, StreamGraphNode, Zap, ZapClassesMapping } from '../../graphSerializer';
import styles from './styles';

export const DIAGRAM_PADDING: Spacing = {
  top: 30,
  right: 5,
  bottom: 30,
  left: 5,
};

function getValueStringRepresentation(value: any): string {
  if (value === undefined) {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (value instanceof Array) {
    let appendix = '';
    if (value.length > 3) {
      value = value.slice(0, 4);
      appendix = ', ...';
    }
    return `[${value.map(getValueStringRepresentation).join(', ')}${appendix}]`
  } else if (typeof value === 'object') {
    return '{...}';
  } else if (typeof value === 'string') {
    return value;
  } else {
    return String(value);
  }
}

function setZapTextContent(vnode: VNode, zap: Zap | null) {
  if (!zap) {
    return;
  }
  const textElem = vnode.elm as Element;
  if (!(zap && zap.type === 'complete')) {
    textElem.innerHTML = getValueStringRepresentation(zap.value);
  }
}

function getZapLabelAtrributes(width: number, height: number): any {
  return {
    x: width + 8,
    y: height / 2 + 1,
    'alignment-baseline': 'middle',
  }
}

function renderNodeZapLabel(width: number, height: number, zap: Zap | null): VNode {
  const result = svg.text({
    class: {
      'zap-label': true,
      [styles.zapLabelStyle]: !zap || zap.type === 'complete',
      [styles.nodeLabelZapNextStyle]: zap && zap.type === 'next',
      [styles.nodeLabelZapErrorStyle]: zap && zap.type === 'error',
      [styles.nodeLabelStyle]: true,
    },
    attrs: getZapLabelAtrributes(width, height),
    hook: {
      insert(vnode: VNode) {
        setZapTextContent(vnode, zap);
      },
      update(oldVNode: VNode, newVNode: VNode) {
        setZapTextContent(newVNode, zap);
      }
    }
  }, '');
  return result;
}

function zapClassesMappingToClasses(zap: Zap | undefined, mapping?: ZapClassesMapping): { [key: string]: boolean } {
  const result = {};
  if (!mapping) {
    return result;
  }

  function addClass(key: keyof ZapClassesMapping, activated?: boolean): void {
    if (!mapping) {
      return;
    }
    const className = mapping[key];
    if (className) {
      result[className] = activated;
    }
  }

  addClass('persistent', true);
  addClass('inactive', !zap);
  ['next', 'error', 'complete'].forEach((type: keyof ZapClassesMapping) => {
    addClass(type, zap && zap.type === type);
  });
  return result;
}

function getNodeGroupTranslation({x, y, width, height, margin}: {
  x: number,
  y: number,
  width: number,
  height: number,
  margin: Spacing,
}): string {
  return `translate(${x + margin.left - (width / 2)}, ${y + margin.top - (height / 2)})`
}

function renderMyNode(node: StreamGraphNode, zapMapping: Record<string, Zap>): VNode {
  const {
    id,
    height,
    width,
    padding = NO_SPACING,
    margin = NO_SPACING,
    showBackground,
    backgroundClasses,
    labelClasses,
    backgroundRadius,
    x = 0,
    y = 0,
    label = '',
  } = node;
  const zap = zapMapping[id];

  const hook = {
    insert(vnode: VNode) {
      // If the background is not visible, there is no need to continue
      const groupElement = vnode.elm as Element;

      const labelElement = groupElement.querySelector('.label') as Element;
      const labelClientRect = labelElement.getBoundingClientRect();
      const labelWidth = labelClientRect.width;

      let rectWidth = width;
      if (label !== '') {
        rectWidth = (labelWidth + padding.left + padding.right);
      }
      const rectHeight = height;

      labelElement.setAttribute('x', String(rectWidth / 2));
      labelElement.setAttribute('y', String(rectHeight / 2 + 1));
      console.log(label, labelElement.getBoundingClientRect(), labelElement['getBBox']());

      if (showBackground) {
        const rectElement = groupElement.querySelector('rect') as Element;
        rectElement.setAttribute('width', String(rectWidth));
      }
      groupElement.setAttribute('transform', getNodeGroupTranslation({
        x, y, width: rectWidth, height, margin
      }));
      const zapLabelElement = groupElement.querySelector('.zap-label') as Element;

      const attrs = getZapLabelAtrributes(rectWidth, rectHeight);
      Object.keys(attrs)
        .forEach(key => zapLabelElement.setAttribute(key, attrs[key]));

      console.log(label, labelElement.getBoundingClientRect(), labelElement['getBBox']());
    }
  };

  const children: VNode[] = [];
  if (showBackground) {
    const backgroundAttrs: any = {
      x: 0,
      y: 0,
      width: width || 0,
      height: height || 0,
    };
    if (backgroundRadius) {
      backgroundAttrs.rx = backgroundAttrs.ry = backgroundRadius;
    }
    children.push(svg.rect({
      attrs: backgroundAttrs,
      class: zapClassesMappingToClasses(zap, backgroundClasses),
    }));
  }
  children.push(
    svg.text({
      class: {
        'label': true,
        [styles.nodeLabelStyle]: true,
        ...zapClassesMappingToClasses(zap, labelClasses)
      },
      attrs: {
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
      }
    }, label));
  children.push(
    renderNodeZapLabel(width, height, zap)
  );

  return svg.g({
    hook,
    attrs: {
      transform: getNodeGroupTranslation({x, y, width, height, margin}),
    }
  }, children);
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
    ({x: x, y: y}),
  );
  // Make arrow tail not touch origin stream
  // points[0].x = points[0].x * 0.4 + points[1].x * 0.6;
  // points[0].y = points[0].y * 0.4 + points[1].y * 0.6;
  const x0 = points[0].x, x1 = points[1].x, y0 = points[0].y, y1 = points[1].y;
  if (Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1)) < 6) {
    points.shift();
  }

  return svg.path({
    class: {
      [styles.edgeType1Style]: true,
    },
    attrs: {
      d: `M ${points.map(({x, y}) => `${x} ${y}`).join(' ')}`,
    },
  });
}

function renderEdgeType2(vw: dagre.Edge, graph: dagre.graphlib.Graph): VNode | null {
  const edgeData: StreamGraphEdge = (graph as any).edge(vw.v, vw.w);
  if (!edgeData.points) {
    return null;
  }
  const points = edgeData.points
    .map(({x, y}) => ({x, y}));

  return svg.g([
    svg.path({
      class: {
        [styles.edgeType2Style]: true,
      },
      attrs: {
        d: `M ${points.map(({x, y}) => `${x} ${y}`).join(' ')}`,
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

export function renderGraph(graph: dagre.graphlib.Graph, zapMapping: Record<string, Zap>, id: string): VNode {
  const {width = 0, height = 0} = typeof graph.graph === 'function' ? graph.graph() : {};
  const attrs = {
    width: width + DIAGRAM_PADDING.left + DIAGRAM_PADDING.right + 200,
    height: height + DIAGRAM_PADDING.top + DIAGRAM_PADDING.bottom,
  };
  const groupAttrs = {
    transform: `translate(${DIAGRAM_PADDING.left}, ${DIAGRAM_PADDING.top})`
  };
  const edges = graph.edges();
  const nodes = graph.nodes();
  return svg({attrs, key: id}, svg.g({attrs: groupAttrs}, [
    ...edges.map(edge => renderEdge(edge, graph)),
    ...nodes.map(identifier => renderMyNode(graph.node(identifier), zapMapping)),
  ]));
}
