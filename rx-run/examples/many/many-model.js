var manyModel = (function () {
  function createRandomItem() {
    var hexColor = Math.floor(Math.random() * 16777215).toString(16);
    while (hexColor.length < 6) {
      hexColor = '0' + hexColor;
    }
    hexColor = '#' + hexColor;
    var randomWidth = Math.floor(Math.random() * 800 + 200);
    return {color: hexColor, width: randomWidth};
  }

  function reassignId(item, index) {
    return {id: index, color: item.color, width: item.width};
  }

  var addItemMod$ = Cycle.createStream(function (addItem$) {
    return addItem$.map(function (amount) {
      var newItems = [];
      for (var i = 0; i < amount; i++) {
        newItems.push(createRandomItem());
      }
      return function (listItems) {
        return listItems.concat(newItems).map(reassignId);
      };
    });
  });

  var removeItemMod$ = Cycle.createStream(function (removeItem$) {
    return removeItem$.map(function (id) {
      return function (listItems) {
        return listItems.filter(function (item) { return item.id !== id; })
          .map(reassignId);
      };
    });
  });

  var colorChangedMod$ = Cycle.createStream(function (changeColor$) {
    return changeColor$.map(function (x) {
      return function (listItems) {
        listItems[x.id].color = x.color;
        return listItems;
      };
    });
  });

  var widthChangedMod$ = Cycle.createStream(function (changeWidth$) {
    return changeWidth$.map(function (x) {
      return function (listItems) {
        listItems[x.id].width = x.width;
        return listItems;
      };
    });
  });

  var items$ = Cycle.Rx.Observable.merge(
      addItemMod$, removeItemMod$, colorChangedMod$, widthChangedMod$
    )
    .startWith([{id: 0, color: 'red', width: 300}])
    .scan(function (listItems, modification) {
      return modification(listItems);
    });

  return {
    items$: items$,
    inject: function inject(intent) {
      addItemMod$.inject(intent.addItem$);
      removeItemMod$.inject(intent.removeItem$);
      colorChangedMod$.inject(intent.changeColor$);
      widthChangedMod$.inject(intent.changeWidth$);
      return intent;
    }
  };
})();
