import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.mapTo', () => {
  it('should transform events to a constant value', (done) => {
    const stream = xs.periodic(100).mapTo(10);
    const expected = [10, 10, 10];
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

  it('should have \'type\' metadata on the operator producer', (done) => {
    const stream = xs.periodic(100).mapTo(10);
    assert.strictEqual(stream['_prod']['type'], 'mapTo');
    done();
  });
});
