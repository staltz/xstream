/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.merge', () => {
  it('should merge OR-style another stream with the primary stream', (done) => {
    const stream = xs.periodic(100).take(2)
      .merge(xs.periodic(120).take(2));
    let expected = [0, 0, 1, 1];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should complete only when all member streams have completed', (done) => {
    const source = xs.periodic(30).take(1);
    const other = xs.periodic(50).take(4);
    const stream = source.merge(other);
    let expected = [0, 0, 1, 2, 3];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should return a Stream when merging a MemoryStream with a Stream', (done) => {
    const input1 = xs.periodic(50).take(4).remember();
    const input2 = xs.periodic(80).take(3);
    const stream: Stream<number> = input1.merge(input2);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a Stream when merging a MemoryStream with a MemoryStream', (done) => {
    const input1 = xs.periodic(50).take(4).remember();
    const input2 = xs.periodic(80).take(3).remember();
    const stream: Stream<number> = input1.merge(input2);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });
});
