import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.skip', () => {
  it('should allow specifying max amount to skip from input stream', (done) => {
    const stream = xs.interval(50).skip(4)
    const expected = [4, 5, 6];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.unsubscribe(observer);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.subscribe(observer);
  });
});
