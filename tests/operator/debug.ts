import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.debug', () => {
  it('should allow inspecting the operator chain', (done) => {
    const expected = [0, 1, 2];
    const stream = xs.interval(50).debug(x => {
      assert.equal(x, expected.shift());
    });
    let listener = {
      next: (x: number) => {
        if (x === 2) {
          assert.equal(expected.length, 0);
          stream.removeListener(listener);
          done();
        }
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(listener);
  });
});
