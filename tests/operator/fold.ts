import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.fold', () => {
  it('should accumulating a value over time', (done) => {
    const stream = xs.interval(50).take(4).fold((x: number, y: number) => x + y, 0);
    const expected = [0, 0, 1, 3, 6];
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
