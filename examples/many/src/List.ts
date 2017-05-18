import xs, {Stream} from 'xstream';
import {button, div, DOMSource, VNode} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {StateSource, collection, pickCombine, pickMerge} from 'cycle-onionify';
import Item, {State as ItemState} from './Item';

export type Actions = {
  add$: Stream<any>,
};

export type State = Array<ItemState>;

let globalid = 0;

function intent(domSource: DOMSource): Actions {
  return {
    add$: xs.merge(
      domSource.select('.add-one-btn').events('click').mapTo(1),
      domSource.select('.add-many-btn').events('click').mapTo(1000),
    ),
  };
}

function model(actions: Actions) {
  const initReducer$ = xs.of(function initReducer(prevState: State): State {
    return [createRandomItemState()];
  });

  function createRandomItemState(): ItemState {
    let hexColor = Math.floor(Math.random() * 16777215).toString(16);
    while (hexColor.length < 6) {
      hexColor = '0' + hexColor;
    }
    hexColor = '#' + hexColor;
    const randomWidth = Math.floor(Math.random() * 800 + 200);
    return {color: hexColor, width: randomWidth, key: `k${++globalid}`};
  }

  const addItemReducer$ = actions.add$
    .map((amount: number) => {
      const newItems: Array<ItemState> = [];
      for (let i = 0; i < amount; i++) {
        newItems.push(createRandomItemState());
      }
      return function addItemReducer(listItems: State): State {
        return listItems.concat(newItems);
      };
    });

  return xs.merge(initReducer$, addItemReducer$);
}

function view(childrenVDoms$: Stream<Array<VNode>>) {
  return childrenVDoms$.map(childrenVDoms =>
    div('.list', [
      div('.addButtons', [
        button('.add-one-btn', 'Add New Item'),
        button('.add-many-btn', 'Add Many Items'),
      ]),
      ...childrenVDoms,
    ]),
  );
}

function List(sources: {onion: StateSource<State>, DOM: DOMSource}) {
  const array$ = sources.onion.state$;

  const instances$ = collection(Item, sources);
  const childrenVDoms$ = instances$.compose(pickCombine('DOM'));
  const childrenReducer$ = instances$.compose(pickMerge('onion'));

  const actions = intent(sources.DOM);
  const parentReducer$ = model(actions);
  const vdom$ = view(childrenVDoms$);
  const reducer$ = xs.merge(parentReducer$, childrenReducer$);

  return {
    DOM: vdom$,
    onion: reducer$,
  };
}

export default List;
