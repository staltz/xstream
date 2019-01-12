/// <reference types="mocha"/>
/// <reference types="node" />
import xs from '../../src/index';
import concat from '../../src/extra/concat';
import dropUntil from '../../src/extra/dropUntil';
import delay from '../../src/extra/delay';
import * as assert from 'assert';

describe('dropUntil (extra)', () => {
  it('should start emitting the stream when another stream emits next', (done: any) => {
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
      }
    });
  });

  it('should emit no items if another stream is empty', (done: any) => {
    const source = xs.periodic(10).take(10);
    const other = xs.empty().compose(delay(50));
    const stream = source.compose(dropUntil(other));
    let emissions = 0;
    stream.addListener({
      next: () => emissions++,
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(emissions, 0);
        done();
      }
    });
  });

  it('should not wait for another stream to complete', (done: any) => {
    const source = xs.periodic(50).take(2);
    const other = concat(xs.of('foo'), xs.never());
    const stream = source.compose(dropUntil(other));
    const expected = [0, 1];
    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });
  });

  it('should not complete the stream when another non empty stream emits complete', (done: any) => {
    const source = xs.periodic(50).take(8);
    const other = xs.periodic(1).take(1).compose(delay(220));
    const stream = source.compose(dropUntil(other));
    const expected = [4, 5, 6, 7];

    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });
  });
});
