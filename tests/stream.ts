import xs from '../src/index';
import * as assert from 'assert';

describe('Stream', () => {
  it('can be subscribed and unsubscribed with one observer', (done) => {
    const stream = xs.interval(100);
    const expected = [0, 1, 2];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.unsubscribe(observer);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.subscribe(observer);
  });
});

describe('Stream.prototype.map', () => {
  it('should transform values from input stream to output stream', (done) => {
    const stream = xs.interval(100).map(i => 10 * i);
    const expected = [0, 10, 20];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.unsubscribe(observer);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.subscribe(observer);
  });
});

describe('Stream.prototype.filter', () => {
  it('should filter in only even numbers from an input stream', (done) => {
    const stream = xs.interval(50).filter(i => i % 2 === 0);
    const expected = [0, 2, 4, 6];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.unsubscribe(observer);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.subscribe(observer);
  });
});

describe('Stream.prototype.take', () => {
  it('should allow specifying max amount to take from input stream', (done) => {
    const stream = xs.interval(50).take(4)
    const expected = [0, 1, 2, 3];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      complete: () => {
        assert.equal(expected.length, 0);
        stream.unsubscribe(observer);
        done();
      },
    };
    stream.subscribe(observer);
  });
});
