import xs from '../../src/index';
import * as assert from 'assert';

describe('xs.combine', () => {
  it('should merge AND-style two streams together', (done) => {
    const stream1 = xs.interval(100).take(2);
    const stream2 = xs.interval(120).take(2);
    const stream = xs.combine((x, y) => `${x}${y}`, stream1, stream2);
    let expected = ['00', '10', '11'];
    stream.subscribe({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      end: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });
});
