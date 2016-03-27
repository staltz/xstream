import xs from '../../src/index';
import {noop} from '../../src/utils/noop';
import * as assert from 'assert';

describe('Stream.prototype.remember', () => {
  it('should replay the second event to a new listener', (done) => {
    const stream = xs.interval(50).take(4).remember();

    stream.addListener({next: noop, error: noop, complete: noop});

    let expected = [1, 2, 3];
    setTimeout(() => {
      stream.addListener({
        next(x) {
          assert.strictEqual(x, expected.shift());
        },
        error: done.fail,
        complete: () => {
          assert.strictEqual(expected.length, 0);
          done();
        }
      });
    }, 125);
  });
});
