let Rx = require(`rx`)
let toHTML = require(`vdom-to-html`)
let {transposeVTree} = require(`./transposition`)

function makeBogusSelect() {
  return function select() {
    return {
      observable: Rx.Observable.empty(),
      events() {
        return Rx.Observable.empty()
      },
    }
  }
}

function makeHTMLDriver() {
  return function htmlDriver(vtree$) {
    let output$ = vtree$.flatMapLatest(transposeVTree).last().map(toHTML)
    output$.select = makeBogusSelect()
    return output$
  }
}

module.exports = {
  makeBogusSelect,

  makeHTMLDriver,
}
