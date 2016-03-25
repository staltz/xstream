import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.last', () => {
  it('should emit only the last value from a stream', (done) => {
    const expected = [50];
    const stream = xs.of(10, 20, 30, 40, 50).last();
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      end: () => {
        assert.equal(expected.length, 0);
        stream.removeListener(listener);
        done();
      },
    };
    stream.addListener(listener);
  });
});
