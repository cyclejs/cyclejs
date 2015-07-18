function manyView(items$) {
  var h = CycleDOM.h;

  function vrenderPerfButton() {
    function run() {
      var t0 = performance.now();
      var addManyBtn = document.querySelector('button.add-many-btn');
      addManyBtn.click();
      var t1 = performance.now();
      console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")
    }
    return h('button.perf-btn', {onclick: run}, 'Benchmark');
  }

  function vrenderTopButtons() {
    return h('div.topButtons', [
      h('button.add-one-btn', 'Add New Item'),
      h('button.add-many-btn', 'Add Many Items'),
      vrenderPerfButton()
    ]);
  }

  function vrenderItem(itemData) {
    return h('many-item.item', {
      itemid: itemData.id,
      color: itemData.color,
      width: itemData.width,
      key: itemData.id
    });
  }

  return {
    DOM: items$.map(function (itemsData) {
      return h('div.everything', {}, [
        vrenderTopButtons(),
        itemsData.map(vrenderItem)
      ]);
    })
  };
}
