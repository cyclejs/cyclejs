import {div, button, span, VNode} from '@cycle/dom';
import {ZapSpeed} from '../model';
import styles from './styles';

export function renderSpeedPicker(speed: ZapSpeed): VNode {
  return div(`.speedPicker.${styles.speedPickerStyle}`, [
    span(`.${styles.speedPickerLabelStyle}`, 'Speed'),

    button({
      class: {
        'slowSpeedButton': true,
        [styles.speedPickerSlowStyle]: true,
        [styles.speedPickerSelectedStyle]: speed === 'slow',
      },
    }, '\u003E'),

    button({
      class: {
        'normalSpeedButton': true,
        [styles.speedPickerNormalStyle]: true,
        [styles.speedPickerSelectedStyle]: speed === 'normal',
      },
    }, '\u226B'),

    button({
      class: {
        'fastSpeedButton': true,
        [styles.speedPickerFastStyle]: true,
        [styles.speedPickerSelectedStyle]: speed === 'fast',
      },
    }, '\u22D9'),
  ]);
}