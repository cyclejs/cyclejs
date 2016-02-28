import {Observable} from 'rx';
import toHTML from 'snabbdom-to-html';
import {transposeVTree} from './transposition';

function makeBogusSelect() {
  return function select() {
    return {
      observable: Observable.empty(),
      events() {
        return Observable.empty();
      },
    };
  };
}

export function makeHTMLDriver() {
  return function htmlDriver(vtree$) {
    const output$ = vtree$.flatMapLatest(transposeVTree).last().map(toHTML);
    output$.select = makeBogusSelect();
    return output$;
  };
}
