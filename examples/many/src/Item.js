import {Rx} from '@cycle/core';
import {button, div, input} from '@cycle/dom';
import combineLatestObj from 'rx-combine-latest-obj';

function intent(DOM, id = ``) {
  const changeColor$ = DOM.select('.color-field')
    .events('input')
    .map(ev => ({color: ev.target.value}));
  const changeWidth$ = DOM.select('.width-slider')
    .events('input')
    .map(ev => ({width: parseInt(ev.target.value)}));
  const destroy$ = DOM.select('.remove-btn')
    .events('click')
    .map(ev => ({id}));

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

function view(state$, id) {
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
    return div(`.item${id}`, {style}, [
      input('.color-field', {
        type: 'text',
        attributes: {value: color}
      }),
      div('.slider-container', [
        input('.width-slider', {
          type: 'range', min: '200', max: '1000',
          attributes: {value: width}
        })
      ]),
      div('.width-content', String(width)),
      button('.remove-btn', 'Remove')
    ]);
  });
}

function Item(sources, id = ``) {
  const actions = intent(sources.DOM, id);
  const state$ = model(sources.props, actions);
  const vtree$ = view(state$, id);

  return {
    DOM: vtree$,
    destroy$: actions.destroy$,
  };
}

export default Item;
