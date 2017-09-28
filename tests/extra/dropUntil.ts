/// <reference types="mocha"/>
/// <reference types="node" />
import xs from '../../src/index';
import dropUntil from '../../src/extra/dropUntil';
import periodic from '../../src/extra/periodic';
import delay from '../../src/extra/delay';
import * as assert from 'assert';

console.warn = () => {};

describe('dropUntil (extra)', () => {
  it('should start emitting the stream when another stream emits next', (done: any) => {
    const source = periodic(50).take(6);
    const other = periodic(220).take(1);
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

  it('should complete the stream when another stream emits complete', (done: any) => {
    const source = periodic(50).take(6);
    const other = xs.empty().compose(delay(220));
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
