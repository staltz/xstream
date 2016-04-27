import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.debug', () => {
  it('should allow inspecting the operator chain', (done) => {
    const expected = [0, 1, 2];
    const stream = xs.periodic(50).take(3).debug(x => {
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
      error: done,
      complete: () => done('complete should not be called'),
    };
    stream.addListener(listener);
  });

  it('should propagate user mistakes in spy as errors', (done) => {
    const source = xs.periodic(30).take(1);
    const stream = source.debug(
      x => <number> <any> (<string> <any> x).toLowerCase()
    );
    stream.addListener({
      next: () => done('next should not be called'),
      error: (err) => {
        assert.notStrictEqual(err.message.match(/is not a function$/), null);
        done();
      },
      complete: () => {
        done('complete should not be called');
      },
    });
  });
});
