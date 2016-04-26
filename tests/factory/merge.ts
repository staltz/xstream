import xs from '../../src/index';
import * as assert from 'assert';

/*
describe('xs.merge', () => {
  it('should merge OR-style two streams together', (done) => {
    const stream = xs.merge(
      xs.periodic(100).take(2),
      xs.periodic(120).take(2)
    );
    let expected = [0, 0, 1, 1];
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
    const stream1 = xs.periodic(30).take(1);
    const stream2 = xs.periodic(50).take(4);
    const stream = xs.merge(stream1, stream2);
    let expected = [0, 0, 1, 2, 3];
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
});
*/
