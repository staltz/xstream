import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.take', () => {
  it('should allow specifying max amount to take from input stream', (done) => {
    const stream = xs.periodic(50).take(4)
    const expected = [0, 1, 2, 3];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      complete: () => {
        assert.equal(expected.length, 0);
        stream.removeListener(listener);
        done();
      },
    };
    stream.addListener(listener);
  });
});
