/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';
import concat from '../../src/extra/concat';
import * as assert from 'assert';

describe('concat (extra)', () => {
  it('should concatenate two synchronous short streams together', (done) => {
    const stream1 = xs.of(1, 2, 3);
    const stream2 = xs.of(40, 50, 60, 70);
    const stream3 = xs.of(8, 9);
    const stream = concat(stream1, stream2, stream3);
    const expected = [1, 2, 3, 40, 50, 60, 70, 8, 9];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should concatenate two asynchronous short streams together', (done) => {
    const stream1 = xs.periodic(50).take(3);
    const stream2 = xs.periodic(100).take(2);
    const stream = concat(stream1, stream2);
    const expected = [0, 1, 2, 0, 1];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should append a synchronous stream after an asynchronous stream', (done) => {
    const stream1 = xs.periodic(50).take(3);
    const stream2 = xs.of(30, 40, 50, 60);
    const stream = concat(stream1, stream2);
    const expected = [0, 1, 2, 30, 40, 50, 60];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });
});
