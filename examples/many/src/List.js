import xs from 'xstream';
import {button, div} from '@cycle/dom';
import isolate from '@cycle/isolate'
import Item from './Item';

function intent(DOM, itemRemove$) {
  return xs.merge(
    DOM.select('.add-one-btn').events('click')
      .mapTo({type: 'ADD_ITEM', payload: 1}),

    DOM.select('.add-many-btn').events('click')
      .mapTo({type: 'ADD_ITEM', payload: 1000}),

    itemRemove$.map(id => ({type: 'REMOVE_ITEM', payload: id}))
  );
}

function model(action$, itemFn) {
  function createRandomItemProps() {
    let hexColor = Math.floor(Math.random() * 16777215).toString(16);
    while (hexColor.length < 6) {
      hexColor = '0' + hexColor;
    }
    hexColor = '#' + hexColor;
    const randomWidth = Math.floor(Math.random() * 800 + 200);
    return {color: hexColor, width: randomWidth};
  }

  let mutableLastId = 0;

  function createNewItem(props) {
    const id = mutableLastId++;
    const sinks = itemFn(props, id);
    return {id, DOM: sinks.DOM.remember(), Remove: sinks.Remove};
  }

  const addItemReducer$ = action$
    .filter(a => a.type === 'ADD_ITEM')
    .map(action => {
      const amount = action.payload;
      let newItems = [];
      for (let i = 0; i < amount; i++) {
        newItems.push(createNewItem(createRandomItemProps()));
      }
      return function addItemReducer(listItems) {
        return listItems.concat(newItems);
      };
    });

  const removeItemReducer$ = action$
    .filter(a => a.type === 'REMOVE_ITEM')
    .map(action => function removeItemReducer(listItems) {
      return listItems.filter(item => item.id !== action.payload);
    });

  const initialState = [createNewItem({color: 'red', width: 300})]

  return xs.merge(addItemReducer$, removeItemReducer$)
    .fold((listItems, reducer) => reducer(listItems), initialState)
    .remember();
}

function view(items$) {
  const addButtons = div('.addButtons', [
    button('.add-one-btn', 'Add New Item'),
    button('.add-many-btn', 'Add Many Items')
  ]);

  return items$.map(items => {
    const itemVNodeStreamsByKey = items.map(item =>
      item.DOM.map(vnode => {
        vnode.key = item.id; return vnode;
      })
    );
    return xs.combine(
      (...vnodes) => div('.list', [addButtons].concat(vnodes)),
      ...itemVNodeStreamsByKey
    );
  }).flatten();
}

function makeItemWrapper(DOM) {
  return function itemWrapper(props, id) {
    const item = isolate(Item)({DOM, Props: xs.of(props)});
    return {
      DOM: item.DOM,
      Remove: item.Remove.mapTo(id)
    }
  }
}

function List(sources) {
  const proxyItemRemove$ = xs.create();
  const action$ = intent(sources.DOM, proxyItemRemove$);
  const itemWrapper = makeItemWrapper(sources.DOM);
  const items$ = model(action$, itemWrapper);
  const itemRemove$ = items$
    .map(items => xs.merge(...items.map(item => item.Remove)))
    .flatten();
  proxyItemRemove$.imitate(itemRemove$);
  const vtree$ = view(items$);

  return {
    DOM: vtree$
  };
}

export default List;
