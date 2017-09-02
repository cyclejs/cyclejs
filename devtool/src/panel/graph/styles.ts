import styleSheet, {
  BLUE_DARK,
  BLUE_LIGHT,
  FONT_FAMILY,
  FONT_SIZE_NORMAL,
  GRAY_DARK,
  GRAY_LIGHTER,
  GREEN_DARK,
  GREEN_LIGHT,
  RED_DARK,
  RED_LIGHT,
  YELLOW_DARK,
  YELLOW_LIGHT,
  BACKGROUND,
} from '../styles';

const ZAP_COOL_OFF_DURATION = '0.4s';
const EVENT_COOL_OFF_DURATION = '3s';
const ZCOD = ZAP_COOL_OFF_DURATION;
const ECOD = EVENT_COOL_OFF_DURATION;
const INACTIVE_OPACITY = '0.4';
const NODE_STROKE_WIDTH = '1px';
const NODE_ZAP_STROKE_WIDTH = '3px';
const EDGE_STROKE_WIDTH = '1px';

export default {
  operatorBackground: styleSheet.registerStyle({
    fill: BACKGROUND,
  }),
  sourceOrSinkNodeStyle: styleSheet.registerStyle({
    'fill': GRAY_LIGHTER,
    'stroke': GRAY_DARK,
    'stroke-width': NODE_STROKE_WIDTH,
    'transition': `fill ${ZCOD}, stroke ${ZCOD}, stroke-width ${ZCOD}`,
  }),

  sourceOrSinkNodeNameStyle: styleSheet.registerStyle({
    'width': 120,
    'font-family': FONT_FAMILY,
    'font-size': FONT_SIZE_NORMAL,
    'fill': GRAY_DARK,
  }),

  inactiveNodeStyle: styleSheet.registerStyle({
    'fill': BLUE_LIGHT,
    'stroke': BLUE_DARK,
    'stroke-width': NODE_STROKE_WIDTH,
    'transition': `fill ${ZCOD}, stroke ${ZCOD}, stroke-width ${ZCOD}`,
  }),

  nodeZapNextStyle: styleSheet.registerStyle({
    'fill': GREEN_LIGHT,
    'stroke': GREEN_DARK,
    'stroke-width': NODE_ZAP_STROKE_WIDTH,
  }),

  nodeZapErrorStyle: styleSheet.registerStyle({
    'fill': RED_LIGHT,
    'stroke': RED_DARK,
    'stroke-width': NODE_ZAP_STROKE_WIDTH,
  }),

  nodeZapCompleteStyle: styleSheet.registerStyle({
    'fill': YELLOW_LIGHT,
    'stroke': YELLOW_DARK,
    'stroke-width': NODE_ZAP_STROKE_WIDTH,
  }),

  nodeInactiveErrorStyle: styleSheet.registerStyle({
    'fill': RED_LIGHT,
    'stroke': RED_DARK,
    'stroke-width': NODE_STROKE_WIDTH,
    'opacity': INACTIVE_OPACITY,
    'transition': `stroke-width ${ZCOD}, opacity ${ZCOD}`,
  }),

  edgeArrowHeadStyle: styleSheet.registerStyle({
    'stroke': BLUE_DARK,
    'fill': BLUE_DARK,
    'stroke-width': EDGE_STROKE_WIDTH,
    'stroke-dasharray': '1,0',
  }),

  edgeType1Style: styleSheet.registerStyle({
    'fill': 'none',
    'stroke': BLUE_DARK,
    'stroke-width': EDGE_STROKE_WIDTH,
    'stroke-dasharray': '1,0',
  }),

  edgeType2Style: styleSheet.registerStyle({
    'fill': 'none',
    'stroke': BLUE_DARK,
    'stroke-width': EDGE_STROKE_WIDTH,
    'stroke-dasharray': '1,0',
  }),

  nodeInactiveCompleteStyle: styleSheet.registerStyle({
    'fill': YELLOW_LIGHT,
    'stroke': YELLOW_DARK,
    'stroke-width': NODE_STROKE_WIDTH,
    'opacity': INACTIVE_OPACITY,
    'transition': `stroke-width ${ZCOD}, opacity ${ZCOD}`,
  }),

  commonNodeLabelStyle: styleSheet.registerStyle({
    'font-family': FONT_FAMILY,
    'font-size': FONT_SIZE_NORMAL,
    'fill': BLUE_DARK,
    'opacity': '0',
    'transition': `opacity ${ECOD}, fill ${ZCOD}`,
  }),

  nodeLabelStyle: styleSheet.registerStyle({
    'font-family': FONT_FAMILY,
    'font-size': FONT_SIZE_NORMAL,
  }),

  zapLabelStyle: styleSheet.registerStyle({
    'font-family': FONT_FAMILY,
    'font-size': FONT_SIZE_NORMAL,
  }),

  zapLabelInactiveStyle: styleSheet.registerStyle({
    'fill': GRAY_DARK,
    'opacity': '0',
    'transition': `opacity ${ECOD}, fill ${ZCOD}`,
  }),

  zapLabelNextStyle: styleSheet.registerStyle({
    'fill': GREEN_DARK,
    'opacity': '1',
  }),

  zapLabelErrorStyle: styleSheet.registerStyle({
    'fill': RED_DARK,
    'opacity': '1',
  }),

  operatorNodeStyle: styleSheet.registerStyle({
    'font-family': FONT_FAMILY,
    'font-size': FONT_SIZE_NORMAL,
    'fill': BLUE_DARK,
    'text-shadow': 'white 2px 2px 0, white -2px 2px 0, white -2px -2px 0, white 2px -2px 0',
  }),
};
