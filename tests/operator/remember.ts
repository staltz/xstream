import xs from '../../src/index';
import * as assert from 'assert';
function noop() {};

describe('Stream.prototype.remember', () => {
  it('should replay the second event to a new listener', (done) => {
    const stream = xs.periodic(50).take(4).remember();

    stream.addListener({next: noop, error: noop, complete: noop});

    let expected = [1, 2, 3];
    setTimeout(() => {
      stream.addListener({
        next(x) {
          assert.strictEqual(x, expected.shift());
        },
        error: done,
        complete: () => {
          assert.strictEqual(expected.length, 0);
          done();
        }
      });
    }, 125);
  });
});
