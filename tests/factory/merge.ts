import xs from '../../src/index';
import * as assert from 'assert';

describe('xs.merge', () => {
  it('should merge OR-style two streams together', (done) => {
    const stream = xs.merge(
      xs.interval(100).take(2),
      xs.interval(120).take(2)
    );
    let expected = [0, 0, 1, 1];
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

  it('should end only when all member streams have ended', (done) => {
    const stream1 = xs.interval(30).take(1);
    const stream2 = xs.interval(50).take(4);
    const stream = xs.merge(stream1, stream2);
    let expected = [0, 0, 1, 2, 3];
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
