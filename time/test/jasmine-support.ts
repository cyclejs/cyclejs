import {mockTimeSource} from '../';
import {setAdapt} from '@cycle/run/lib/adapt';

describe('jasmine support', () => {
  it('calls done.fail upon failure if present', mochaDone => {
    const done = function() {
      throw new Error('expected test to fail');
    };

    done['fail'] = (err: any) => {
      mochaDone();
    };

    const Time = mockTimeSource();

    Time.assertEqual(Time.diagram('-1-'), Time.diagram('-2-'));

    Time.run(done);
  });
});
