/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.last', () => {
  it('should emit only the last value from a stream', (done) => {
    const expected = [50];
    const stream = xs.of(10, 20, 30, 40, 50).last();
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        stream.removeListener(listener);
        done();
      },
    };
    stream.addListener(listener);
  });

  it('should return a Stream if input stream is a Stream', (done) => {
    const input = xs.of<number>(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: Stream<number> = input.last();
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a Stream if input stream is a MemoryStream', (done) => {
    const input = xs.of<number>(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: Stream<number> = input.last();
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });
});
