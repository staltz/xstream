import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.startWith', () => {
  it('should allow starting with a value', (done) => {
    const stream = xs.of(100);

    stream.startWith(1).take(1).addListener({
      next(x: any) {
        assert.strictEqual(x, 1);
      },
      error: done,
      complete: done
    });
  });

  it('should return a stream with memory by default', (done) => {
    const stream = xs.periodic(100).take(3).startWith(1);

    const expected1 = [1, 0, 1, 2];
    const expected2 = [0, 1, 2];

    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(expected1.shift(), x);
      },
      error: done,
      complete: () => void 0
    });

    setTimeout(() => {
      stream.addListener({
      next: (x: number) => {
        assert.strictEqual(expected2.shift(), x);
      },
      error: done,
      complete: () => done()
    });
    }, 150)
  });
});
