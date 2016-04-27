import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.drop', () => {
  it('should allow specifying max amount to drop from input stream', (done) => {
    const stream = xs.periodic(50).drop(4);
    const expected = [4, 5, 6];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done,
      complete: () => done('complete should not be called'),
    };
    stream.addListener(listener);
  });
});
