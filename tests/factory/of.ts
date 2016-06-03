/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';
import * as assert from 'assert';

describe('xs.of', () => {
  it('should convert multiple items to a stream', (done) => {
    const stream = xs.of(10, 20, 30, 40, 50)
      .map(i => String(i));
    let expected = ['10', '20', '30', '40', '50'];
    let listener = {
      next: (x: string) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    };
    stream.addListener(listener);
  });
});
