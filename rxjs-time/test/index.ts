import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as Rx from 'rxjs';
import {Observable} from 'rxjs';
import {mockDOMSource} from '@cycle/dom';
import {mockTimeSource} from '../lib/index';

describe('@cycle/time', function() {
  it('should work with rxjs', function(done) {
    function Counter({DOM}: any) {
      const add$ = DOM.select('.add').events('click').map(() => +1);

      const subtract$ = DOM.select('.subtract').events('click').map(() => -1);

      const change$ = Observable.merge(add$, subtract$);

      const add = (a: number, b: number) => a + b;

      const count$ = change$.scan(add, 0);

      return {
        count$,
      };
    }

    const Time = mockTimeSource();
    const addClick = '---x-x-x------x-|';
    const subtractClick = '-----------x----|';

    const expectedCount = '0--1-2-3---2--3-|';

    const DOM = mockDOMSource({
      '.add': {
        click: Time.diagram(addClick),
      },
      '.subtract': {
        click: Time.diagram(subtractClick),
      },
    });

    const counter = Counter({DOM});

    Time.assertEqual(counter.count$, Time.diagram(expectedCount));

    Time.run(done);
  });
});
