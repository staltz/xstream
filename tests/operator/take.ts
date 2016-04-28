import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.take', () => {
  it('should allow specifying max amount to take from input stream', (done) => {
    const stream = xs.periodic(50).take(4);
    const expected = [0, 1, 2, 3];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        stream.removeListener(listener);
        done();
      },
    };
    stream.addListener(listener);
  });

  it('should not break sibling listeners when TakeOperator tears down', (done) => {
    const source = xs.periodic(50);
    const streamA = source.take(3);
    const streamB = source.take(6);
    const expectedA = [0, 1, 2];
    const expectedB = [0, 1, 2, 3, 4, 5];

    streamA.addListener({
      next: (x: number) => {
        assert.equal(x, expectedA.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expectedA.length, 0);
      },
    });

    streamB.addListener({
      next: (x: number) => {
        assert.equal(x, expectedB.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expectedB.length, 0);
        done();
      },
    });
  });
});
