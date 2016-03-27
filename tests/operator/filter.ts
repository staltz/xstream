import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.filter', () => {
  it('should filter in only even numbers from an input stream', (done) => {
    const stream = xs.interval(50).filter(i => i % 2 === 0);
    const expected = [0, 2, 4, 6];
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
