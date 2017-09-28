/// <reference types="mocha"/>
/// <reference types="node" />
import xs from '../../src/index';
import concat from '../../src/extra/concat';
import periodic from '../../src/extra/periodic';
import * as assert from 'assert';

console.warn = () => {};

describe('concat (extra)', () => {
  it('should concatenate two synchronous short streams together', (done: any) => {
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

  it('should concatenate two asynchronous short streams together', (done: any) => {
    const stream1 = periodic(50).take(3);
    const stream2 = periodic(100).take(2);
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

  it('should append a synchronous stream after an asynchronous stream', (done: any) => {
    const stream1 = periodic(50).take(3);
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
