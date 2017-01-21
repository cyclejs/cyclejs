/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';
import {makeServerHistoryDriver} from '../../src';

describe('makeServerHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeServerHistoryDriver, 'function');
  });

  it('should return a function' , () => {
    assert.strictEqual(typeof makeServerHistoryDriver(), 'function');
  });
});
