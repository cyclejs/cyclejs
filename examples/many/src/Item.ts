import xs, {Stream} from 'xstream';
import {button, div, input, thunk, DOMSource, VNode} from '@cycle/dom';
import {StateSource} from 'cycle-onionify';

export type State = {
  color: string,
  width: number,
  key?: any,
};

export type Actions = {
  changeColor$: Stream<any>,
  changeWidth$: Stream<any>,
  remove$: Stream<any>,
};

function intent(domSource: DOMSource): Actions {
  return {
    changeColor$: domSource
      .select('.color-field').events('input')
      .map(ev => (ev.target as any).value),

    changeWidth$: domSource
      .select('.width-slider').events('input')
      .map(ev => parseInt((ev.target as any).value)),

    remove$: domSource
      .select('.remove-btn').events('click')
      .mapTo(null),
  };
}

function model(actions: Actions) {
  const initReducer$ = xs.of(function initReducer(prevState: State): State {
    if (prevState) {
      return prevState;
    } else {
      return {color: '#888', width: 200};
    }
  });

  const removeReducer$ = actions.remove$
    .mapTo(function removeReducer(prevState: State): State {
      return undefined;
    });

  const changeWidthReducer$ = actions.changeWidth$
    .map((width: number) => function changeWidthReducer(prevState: State): State {
      return {...prevState, width};
    });

  const changeColorReducer$ = actions.changeColor$
    .map((color: string) => function changeColorReducer(prevState: State): State {
      return {...prevState, color};
    });

  return xs.merge(
    initReducer$, removeReducer$, changeWidthReducer$, changeColorReducer$,
  );
}

function view(state$: Stream<State>) {
  return state$.map(({color, width, key}) => {
    const style = {
      border: '1px solid #000',
      background: 'none repeat scroll 0% 0% ' + color,
      width: width + 'px',
      height: '70px',
      display: 'block',
      padding: '20px',
      margin: '10px 0px',
    };

    // Note! we should roll our own thunk which carries data.isolate

    return thunk('div.item', key, (_color: string, _width: number) =>
      div('.item', {style, key: key}, [
        input('.color-field', {
          attrs: {type: 'text', value: _color},
        }),
        div('.slider-container', [
          input('.width-slider', {
            // attrs: {type: 'range', min: '200', max: '1000', value: '300'}
            attrs: {type: 'range', min: '200', max: '1000', value: _width},
          }),
        ]),
        div('.width-content', {key: key + 'wc'}, String(_width)),
        button('.remove-btn', 'Remove'),
      ])
    , [color, width]);
  });
}

function Item(sources: {DOM: DOMSource, onion: StateSource<State>}) {
  const actions = intent(sources.DOM);
  const reducer$ = model(actions);
  const vdom$ = view(sources.onion.state$) as Stream<VNode>;

  return {
    DOM: vdom$,
    onion: reducer$,
  };
}

export default Item;
