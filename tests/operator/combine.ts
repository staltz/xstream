import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.combine', () => {
  it('should merge AND-style another stream with the primary stream', (done) => {
    const source = xs.periodic(100).take(2);
    const other = xs.periodic(120).take(2);
    const stream = source.combine((x, y) => `${x}${y}`, other);
    let expected = ['00', '10', '11'];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should complete only when all member streams have completed', (done) => {
    const source = xs.periodic(30).take(1);
    const other = xs.periodic(50).take(4);
    const stream = source.combine((x, y) => `${x}${y}`, other);
    let expected = ['00', '01', '02', '03'];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should propagate user mistakes in project as errors', (done) => {
    const source = xs.periodic(30).take(1);
    const other = xs.periodic(50).take(4);
    const stream = source.combine(
      (x, y) => <number> <any> (<string> <any> x).toLowerCase(),
      other
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
