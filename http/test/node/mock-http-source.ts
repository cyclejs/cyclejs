import 'mocha';
import * as assert from 'assert';
import {mockHTTPDriver, RequestOptions} from '../../src/index';
import xs from 'xstream';
import {setup} from '../../../run/src';

describe.only('mockHTTPDriver', function() {
  it('works', function() {
    function main(sources: any) {
      return {
        response$: sources.HTTP.select().flatten(),
      };
    }

    const drivers = {
      HTTP: mockHTTPDriver(request => ({text: 'hi', status: 200})),
    };

    const {sinks, run} = setup(main, drivers);

    const dispose = run();
  });
});
