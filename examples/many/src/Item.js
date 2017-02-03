import xs from 'xstream';
import {button, div, input} from '@cycle/dom';

function intent(domSource) {
  return xs.merge(
    domSource.select('.color-field').events('input')
      .map(ev => ({type: 'CHANGE_COLOR', payload: ev.target.value})),

    domSource.select('.width-slider').events('input')
      .map(ev => ({type: 'CHANGE_WIDTH', payload: parseInt(ev.target.value)})),

    domSource.select('.remove-btn').events('click')
      .mapTo({type: 'REMOVE'})
  );
}

function model(props$, action$) {
  const usePropsReducer$ = props$
    .map(props => function usePropsReducer(oldState) {
      return props;
    });

  const changeWidthReducer$ = action$
    .filter(a => a.type === 'CHANGE_WIDTH')
    .map(action => function changeWidthReducer(oldState) {
      return {color: oldState.color, width: action.payload};
    });

  const changeColorReducer$ = action$
    .filter(a => a.type === 'CHANGE_COLOR')
    .map(action => function changeColorReducer(oldState) {
      return {color: action.payload, width: oldState.width};
    });

  return xs.merge(usePropsReducer$, changeWidthReducer$, changeColorReducer$)
    .fold((state, reducer) => reducer(state), {color: '#888', width: 200});
}

function view(state$) {
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
    return div('.item', {style}, [
      input('.color-field', {
        attrs: {type: 'text', value: color}
      }),
      div('.slider-container', [
        input('.width-slider', {
          attrs: {type: 'range', min: '200', max: '1000', value: width}
        })
      ]),
      div('.width-content', String(width)),
      button('.remove-btn', 'Remove')
    ]);
  });
}

function Item(sources) {
  const action$ = intent(sources.DOM);
  const state$ = model(sources.Props, action$);
  const vtree$ = view(state$);

  return {
    DOM: vtree$,
    Remove: action$.filter(action => action.type === 'REMOVE'),
  };
}

export default Item;
