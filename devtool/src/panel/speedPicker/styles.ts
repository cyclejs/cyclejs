import styleSheet, {GRAY, GRAY_LIGHTER, GRAY_LIGHT, GREEN_DARK, FONT_FAMILY} from '../styles';

const SPEED_PICKER_HEIGHT = '22px';
const SPEED_PICKER_BUTTON_WIDTH = '35px';
const SPEED_PICKER_BUTTON_SHADOW = '0px 1px 0px 0px rgba(0,0,0,0.2)';
const SPEED_PICKER_BUTTON_BORDER_RADIUS = '8px';

export default {
  speedPickerStyle: styleSheet.registerStyle({
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
  }),

  speedPickerLabelStyle: styleSheet.registerStyle({
    'font-family': FONT_FAMILY,
    'font-size': '12px',
    'line-height': SPEED_PICKER_HEIGHT,
    'color': GRAY,
    'margin-right': '5px',
  }),

  speedPickerSlowStyle: styleSheet.registerStyle({
    'background-color': GRAY_LIGHTER,
    'height': SPEED_PICKER_HEIGHT,
    'border': 'none',
    'cursor': 'pointer',
    'width': SPEED_PICKER_BUTTON_WIDTH,
    'text-align': 'center',
    'color': GRAY,
    'font-size': '16px',
    'line-height': '19px',
    'border-top-left-radius': SPEED_PICKER_BUTTON_BORDER_RADIUS,
    'border-bottom-left-radius': SPEED_PICKER_BUTTON_BORDER_RADIUS,
    'outline': 'none',
    'box-shadow': SPEED_PICKER_BUTTON_SHADOW,
    '&:hover': {
      'background-color': GRAY_LIGHT,
    },
  }),

  speedPickerNormalStyle: styleSheet.registerStyle({
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
    },
  }),

  speedPickerFastStyle: styleSheet.registerStyle({
    'background-color': GRAY_LIGHTER,
    'height': SPEED_PICKER_HEIGHT,
    'border': 'none',
    'cursor': 'pointer',
    'width': SPEED_PICKER_BUTTON_WIDTH,
    'text-align': 'center',
    'color': GRAY,
    'font-size': '22px',
    'line-height': '1px',
    'border-top-right-radius': SPEED_PICKER_BUTTON_BORDER_RADIUS,
    'border-bottom-right-radius': SPEED_PICKER_BUTTON_BORDER_RADIUS,
    'outline': 'none',
    'box-shadow': SPEED_PICKER_BUTTON_SHADOW,
    '&:hover': {
      'background-color': GRAY_LIGHT,
    },
  }),

  speedPickerSelectedStyle: styleSheet.registerStyle({
    'color': GREEN_DARK,
  }),
};
