/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.drop', () => {
  it('should allow specifying max amount to drop from input stream', (done) => {
    const stream = xs.periodic(50).drop(4);
    const expected = [4, 5, 6];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done,
      complete: () => done('complete should not be called'),
    };
    stream.addListener(listener);
  });

  it('should return a Stream if input stream is a Stream', (done) => {
    const input = xs.of<number>(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: Stream<number> = input.drop(1);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a Stream if input stream is a MemoryStream', (done) => {
    const input = xs.of<number>(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: Stream<number> = input.drop(1);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });
});
