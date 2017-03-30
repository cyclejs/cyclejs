import 'mocha';
import * as assert from 'assert';
import {mockHTTPSource} from '../../lib/index';

describe('mockHttpSource', function () {
  it('should be in accessible in the API', function () {
    assert.strictEqual(typeof mockHTTPSource, 'function');
  });
});
