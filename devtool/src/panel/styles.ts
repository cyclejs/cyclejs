import * as FreeStyle from 'free-style';

const styleSheet = FreeStyle.create();

// Palette
export const GRAY_DARK = '#444444';
export const GRAY = '#777777';
export const GRAY_LIGHT = '#CDCDCD';
export const GRAY_LIGHTER = '#DDDDDD';

export const BLUE_DARK = '#518FFF';
export const BLUE_LIGHT = '#CDE6FF';

export const GREEN_DARK = '#00C194';
export const GREEN_LIGHT = '#6DFFB3';

export const RED_DARK = '#F53800';
export const RED_LIGHT = '#FFA382';

export const YELLOW_DARK = '#DDAA02';
export const YELLOW_LIGHT = '#FFEE6D';

// Dimensions
export const FONT_SIZE_NORMAL = '14px';
export const FONT_FAMILY = 'Source Sans Pro, sans-serif';

export const devToolStyle = styleSheet.registerStyle({
  'padding-top': '40px',
});

export const invalidStateStyle = styleSheet.registerStyle({
  'font-family': FONT_FAMILY,
  'p': {
    'font-size': FONT_SIZE_NORMAL,
  },
  'li': {
    'font-size': FONT_SIZE_NORMAL,
  },
  'pre': {
    'display': 'inline-block',
    'font-size': FONT_SIZE_NORMAL,
  },
  'a': {
    'color': '#409B9E',
    'text-decoration': 'inherit',
    'border-bottom': '1px dotted #409B9E',
  },
});

export default styleSheet;