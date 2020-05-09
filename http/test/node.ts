import * as assert from 'assert';
import { of, filter, pipe, subscribe, flatten } from '@cycle/callbags';
import { makeRequest } from '@minireq/node';

import { run } from '@cycle/run';
import { HttpApi, makeHttpPlugin } from '../src/index';

const uri = 'http://localhost:3000';

describe('HTTP Driver in Node.js', function() {
  it('should auto-execute HTTP request when without listening to response stream', function(done) {
    function main(_sources: { HTTP: HttpApi }) {
      return {
        HTTP: of({
          url: uri + '/pet',
          method: 'POST',
          send: { name: 'Woof', species: 'Dog' },
          id: 0
        })
      };
    }

    const request = makeRequest();

    const plugins = {
      HTTP: makeHttpPlugin(request)
    };

    run(main, plugins, []);

    setTimeout(() => {
      const { promise } = request({
        url: uri + '/petResponse',
        method: 'GET'
      });

      promise.then((res: any) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data, 'added Woof the Dog');
        done();
      });
    }, 200);
  });
});
