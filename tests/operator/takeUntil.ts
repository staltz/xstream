import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.takeUntil', () => {
  it('should end a stream when another emits', (done) => {
    const stream = xs.interval(50).takeUntil(xs.interval(210));
    const expected = [0, 1, 2, 3];
    stream.subscribe({
      next(x: number) {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      end() {
        assert.equal(expected.length, 0);
        done();
      },
    }
    );
  });
});
