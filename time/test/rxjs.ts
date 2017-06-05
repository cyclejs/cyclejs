import {Observable} from 'rxjs/Rx';
import {setAdapt} from '@cycle/run/lib/adapt';

import {mockTimeSource} from '../rxjs';

describe('rxjs', () => {
  before(() => setAdapt(stream => Observable.from(stream)));

  it('works with @cycle/time', done => {
    const Time = mockTimeSource();

    const actual$ = Observable.of('a').let(Time.delay(60));
    const expected$ = Time.diagram(`---(a|)`);

    Time.assertEqual(actual$, expected$);
    Time.run(done);
  });
});
