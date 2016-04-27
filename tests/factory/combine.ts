import xs from '../../src/index';
import * as assert from 'assert';

describe('xs.combine', () => {
  it('should combine AND-style two streams together', (done) => {
    const stream1 = xs.periodic(100).take(2);
    const stream2 = xs.periodic(120).take(2);
    const stream = xs.combine((x, y) => `${x}${y}`, stream1, stream2);
    let expected = ['00', '10', '11'];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should complete only when all member streams have completed', (done) => {
    const stream1 = xs.periodic(30).take(1);
    const stream2 = xs.periodic(50).take(4);
    const stream = xs.combine((x, y) => `${x}${y}`, stream1, stream2);
    let expected = ['00', '01', '02', '03'];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should propagate user mistakes in project as errors', (done) => {
    const stream1 = xs.periodic(30).take(1);
    const stream2 = xs.periodic(50).take(4);
    const stream = xs.combine(
      (x, y) => <number> <any> (<string> <any> x).toLowerCase(),
      stream1, stream2
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
