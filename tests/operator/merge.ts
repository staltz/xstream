import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.merge', () => {
  it('should merge OR-style another stream with the primary stream', (done) => {
    const stream = xs.interval(100).take(2)
      .merge(xs.interval(120).take(2));
    let expected = [0, 0, 1, 1];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should complete only when all member streams have completed', (done) => {
    const source = xs.interval(30).take(1);
    const other = xs.interval(50).take(4);
    const stream = source.merge(other);
    let expected = [0, 0, 1, 2, 3];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });
});
