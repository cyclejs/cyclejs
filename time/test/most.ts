import * as most from 'most';
import {setAdapt} from '@cycle/run/lib/adapt';

import {mockTimeSource} from '../most';

describe('most', () => {
  before(() => setAdapt(stream => most.from(stream as any)));

  it('works with @cycle/time', done => {
    const Time = mockTimeSource();

    const actual$ = most.of('a').thru(Time.delay(60));
    const expected$ = Time.diagram(`---(a|)`);

    Time.assertEqual(actual$, expected$);
    Time.run(done);
  });
});
