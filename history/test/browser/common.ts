/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';
import {makeHashHistoryDriver, makeHistoryDriver} from '../../src';

describe('makeHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeHistoryDriver, 'function');
  });

  it('should return a function' , () => {
    assert.strictEqual(typeof makeHistoryDriver(), 'function');
  });
});

describe('makeHashHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeHashHistoryDriver, 'function');
  });

  it('should return a function' , () => {
    assert.strictEqual(typeof makeHashHistoryDriver(), 'function');
  });
});
