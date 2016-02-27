import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.take', () => {
  it('should allow specifying max amount to take from input stream', (done) => {
    const stream = xs.interval(50).take(4)
    const expected = [0, 1, 2, 3];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      end: () => {
        assert.equal(expected.length, 0);
        stream.unsubscribe(observer);
        done();
      },
    };
    stream.subscribe(observer);
  });
});
