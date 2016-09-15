/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';
import * as assert from 'assert';

import * as most from 'most';

describe('xs.fromObservable', () => {
  it('should convert an observable to a stream', (done) => {
    const observable = most.from([10, 20, 30, 40, 50]);
    const stream = xs.fromObservable(observable)
      .map(i => String(i));
    let expected = ['10', '20', '30', '40', '50'];

    stream.addListener({
      next: (x: string) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });
});
