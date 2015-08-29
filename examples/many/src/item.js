import {Rx} from '@cycle/core';
import {h} from '@cycle/dom';
import combineLatestObj from 'rx-combine-latest-obj';

function intent(DOM, name = []) {
  const changeColor$ = DOM.get(name.join(' ') + '.item .color-field', 'input')
    .map(ev => ({color: ev.target.value, name}));
  const changeWidth$ = DOM.get(name.join(' ') + '.item .width-slider', 'input')
    .map(ev => ({width: parseInt(ev.target.value), name}));
  const destroy$ = DOM.get(name.join(' ') + '.item .remove-btn', 'click')
    .map(ev => ({name}));

  return {changeColor$, changeWidth$, destroy$};
}

function model(props, actions) {
  const color$ = props.color$.take(1)
    .startWith('#888')
    .concat(actions.changeColor$.map(({color}) => color));
  const width$ = props.width$.take(1)
    .startWith(200)
    .concat(actions.changeWidth$.map(({width}) => width));

  return combineLatestObj({color$, width$});
}

function view(state$, name = []) {
  return state$.map(({color, width}) => {
    const style = {
      border: '1px solid #000',
      background: 'none repeat scroll 0% 0% ' + color,
      width: width + 'px',
      height: '70px',
      display: 'block',
      padding: '20px',
      margin: '10px 0px'
    };
    return h('div.item' + name[name.length-1], {style}, [
      h('input.color-field', {
        type: 'text',
        attributes: {value: color}
      }),
      h('div.slider-container', [
        h('input.width-slider', {
          type: 'range', min: '200', max: '1000',
          attributes: {value: width}
        })
      ]),
      h('div.width-content', String(width)),
      h('button.remove-btn', 'Remove')
    ]);
  });
}

function item(sources, name = []) {
  const actions = intent(sources.DOM, name);
  const state$ = model(sources.props, actions);
  const vtree$ = view(state$, name);

  return {
    DOM: vtree$,
    destroy$: actions.destroy$,
  };
}

export default item;
