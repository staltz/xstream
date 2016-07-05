/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';
import fromDiagram from '../../src/extra/fromDiagram';
import * as assert from 'assert';

describe('fromDiagram (extra)', () => {
  it('should create a nice finite stream with string values', (done) => {
    const stream = fromDiagram('--a--b----c----d---|')
    const expected = ['a', 'b', 'c', 'd'];

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

  it('should create a stream that emits an error', (done) => {
    const stream = fromDiagram('--a--b----c----d---#')
    const expected = ['a', 'b', 'c', 'd'];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err) => {
        assert.equal(expected.length, 0);
        done();
      },
      complete: () => done('complete should not be called'),
    });
  });

  it('should create a stream using strings as keys for values', (done) => {
    const stream = fromDiagram('--a--b----c--|', {
      values: {a: 10, b: 20, c: 30}
    });
    const expected = [10, 20, 30];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should support 0 as a value behind a key in the values object', (done) => {
    const stream = fromDiagram('--a--b----c--|', {
      values: {a: 0, b: 1, c: 2}
    });
    const expected = [0, 1, 2];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should support null as a value behind a key in the values object', (done) => {
    const stream = fromDiagram('--a--b----c--|', {
      values: {a: null, b: 1, c: 2}
    });
    const expected = [null, 1, 2];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should create a stream with some sense of order', (done) => {
    const stream1 = fromDiagram('-a---c--|');
    const stream2 = fromDiagram('---b---d|');
    const stream = xs.merge(stream1, stream2);
    const expected = ['a', 'b', 'c', 'd'];

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

  it('should create an infinite stream some sense of order', (done) => {
    const stream1 = fromDiagram('-a---c---');
    const stream2 = fromDiagram('---b---d-');
    const stream = xs.merge(stream1, stream2);
    const expected = ['a', 'b', 'c', 'd'];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          done();
        }
      },
      error: (err: Error) => done(err),
      complete: () => done('complete should not be called'),
    });
  });
});
