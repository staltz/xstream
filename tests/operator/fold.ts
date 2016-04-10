import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.fold', () => {
  it('should accumulating a value over time', (done) => {
    const stream = xs.periodic(50).take(4).fold((x: number, y: number) => x + y, 0);
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

  it('should propagate user mistakes in accumulate as errors', (done) => {
    const source = xs.periodic(30).take(1);
    const stream = source.fold(
      (x, y) => <number> <any> (<string> <any> x).toLowerCase(),
      0
    );
    const expected = [0];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err) => {
        assert.equal(expected.length, 0);
        assert.strictEqual(err.message, 'x.toLowerCase is not a function');
        done();
      },
      complete: () => {
        done('complete should not be called');
      },
    });
  });
});
