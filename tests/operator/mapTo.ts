import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.mapTo', () => {
  it('should transform events to a constant value', (done) => {
    const stream = xs.interval(100).mapTo(10);
    const expected = [10, 10, 10];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.addListener(listener);
  });
});
