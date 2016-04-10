import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.filter', () => {
  it('should filter in only even numbers from an input stream', (done) => {
    const stream = xs.periodic(50).filter(i => i % 2 === 0);
    const expected = [0, 2, 4, 6];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.addListener(listener);
  });

  it('should propagate user mistakes in predicate as errors', (done) => {
    const source = xs.periodic(30).take(1);
    const stream = source.filter(
      x => (<string> <any> x).toLowerCase() === 'a'
    );
    stream.addListener({
      next: () => done('next should not be called'),
      error: (err) => {
        assert.strictEqual(err.message, 'x.toLowerCase is not a function');
        done();
      },
      complete: () => {
        done('complete should not be called');
      },
    });
  });
});
