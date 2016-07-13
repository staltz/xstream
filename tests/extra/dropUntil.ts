/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';
import dropUntil from '../../src/extra/dropUntil';
import delay from '../../src/extra/delay';
import * as assert from 'assert';

describe('dropUntil (extra)', () => {
  it('should start emitting the stream when another stream emits next', (done) => {
    const source = xs.periodic(50).take(6);
    const other = xs.periodic(220).take(1);
    const stream = source.compose(dropUntil(other));
    const expected = [4, 5];

    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      },
    });
  });

  it('should complete the stream when another stream emits complete', (done) => {
    const source = xs.periodic(50).take(6);
    const other = xs.empty().compose(delay<any>(220));
    const stream = source.compose(dropUntil(other));
    const expected = [4, 5];

    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      },
    });
  });
});
