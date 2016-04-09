import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.map', () => {
  it('should transform values from input stream to output stream', (done) => {
    const stream = xs.interval(100).map(i => 10 * i);
    const expected = [0, 10, 20];
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

  it('should propagate user mistakes in project as errors', (done) => {
    const source = xs.interval(30).take(1);
    const stream = source.map(
      x => (<string> <any> x).toLowerCase()
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
