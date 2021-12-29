import {Observable, from, of} from 'rxjs';
import {setAdapt} from '@cycle/run/lib/adapt';

import {mockTimeSource} from '../src/rxjs';

describe('rxjs', () => {
  before(() => setAdapt(from as any));

  it('works with @cycle/time', done => {
    const Time = mockTimeSource();

    const actual$ = of('a').pipe(Time.delay(60));
    const expected$ = Time.diagram(`---(a|)`);

    Time.assertEqual(actual$, expected$);
    Time.run(done);
  });
});
