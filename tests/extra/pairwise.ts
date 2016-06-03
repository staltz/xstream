/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';
import pairwise from '../../src/extra/pairwise';
import * as assert from 'assert';

describe('pairwise (extra)', () => {
  it('should group consecutive pairs as arrays', (done) => {
    const stream = xs.of(1, 2, 3, 4, 5, 6).compose(pairwise);
    const expected = [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ];

    stream.addListener({
      next: (x: [number, number]) => {
        const e = expected.shift();
        assert.equal(x.length, e.length);
        assert.equal(x[0], e[0]);
        assert.equal(x[1], e[1]);
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });
});
