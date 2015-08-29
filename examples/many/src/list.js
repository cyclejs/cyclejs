import {Rx} from '@cycle/core';
import {h} from '@cycle/dom';
import item from './item';

function intent(DOM, itemActions, name = []) {
  const addItem$ = Rx.Observable.merge(
    DOM.get(name.join(' ') + '.list .add-one-btn', 'click').map(() => 1),
    DOM.get(name.join(' ') + '.list .add-many-btn', 'click').map(() => 1000)
  );
  const removeItem$ = itemActions.destroy$
    .map(({name}) => parseInt(name[name.length-1].replace('.list-item', '')));

  return {
    addItem$,
    removeItem$,
  };
}

function model(actions, itemFn) {
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
    sinks.DOM = sinks.DOM.replay(null, 1);
    sinks.DOM.connect();
    sinks.destroy$ = sinks.destroy$.publish();
    sinks.destroy$.connect();
    return {id, DOM: sinks.DOM, destroy$: sinks.destroy$};
  }

  const initialState = [createNewItem({color: 'red', width: 300})]

  const addItemMod$ = actions.addItem$.map(amount => {
    let newItems = [];
    for (let i = 0; i < amount; i++) {
      newItems.push(createNewItem(createRandomItemProps()));
    }
    return function (listItems) {
      return listItems.concat(newItems);
    };
  });

  const removeItemMod$ = actions.removeItem$.map(id =>
    function (listItems) {
      return listItems.filter(item => item.id !== id);
    }
  );

  return Rx.Observable.merge(addItemMod$, removeItemMod$)
    .startWith(initialState)
    .scan((listItems, modification) => modification(listItems))
    .publishValue(initialState).refCount();
}

function view(itemDOMs$, name = []) {
  function renderTopButtons() {
    return h('div.topButtons', [
      h('button.add-one-btn', 'Add New Item'),
      h('button.add-many-btn', 'Add Many Items')
    ]);
  }

  return itemDOMs$.map(itemDOMs =>
    h('div.list' + name[name.length-1],
      [renderTopButtons()].concat(itemDOMs)
    )
  );
}

function makeItemWrapper(DOM, name = []) {
  return function itemWrapper(props, id) {
    const propsObservables = {
      color$: Rx.Observable.just(props.color),
      width$: Rx.Observable.just(props.width),
    };
    return item({DOM, props: propsObservables}, name.concat(`.list-item${id}`));
  }
}

function list(sources, name = []) {
  const itemActions = {destroy$: new Rx.Subject()};
  const actions = intent(sources.DOM, itemActions, name);
  const itemWrapper = makeItemWrapper(sources.DOM, name);
  const items$ = model(actions, itemWrapper);
  const itemDOMs$ = items$.map(items => items.map(item => item.DOM));
  const itemDestroy$ = items$
    .filter(items => items.length)
    .flatMapLatest(items =>
      Rx.Observable.merge(items.map(item => item.destroy$))
    );
  itemDestroy$.subscribe(itemActions.destroy$.asObserver());
  const vtree$ = view(itemDOMs$, name);

  return {
    DOM: vtree$
  };
}

export default list;
