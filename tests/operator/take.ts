/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.take', () => {
  it('should allow specifying max amount to take from input stream', (done: any) => {
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

  it('should return a Stream if input stream is a Stream', (done: any) => {
    const input = xs.of(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: Stream<number> = input.take(2);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a MemoryStream if input stream is a MemoryStream', (done: any) => {
    const input = xs.of(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: MemoryStream<number> = input.take(2);
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  });

  it('should not break sibling listeners when TakeOperator tears down', (done: any) => {
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

  it('should just complete if given max=0', (done: any) => {
    const stream = xs.periodic(50).take(0);

    stream.addListener({
      next: (x: number) => {
        done('next should not be called');
      },
      error: (err: any) => done(err),
      complete: () => {
        done();
      },
    });
  });

  it('should terminate properly when "next" function recursively calls itself', (done: any) => {
    const producer = {
      start: (listener: any) => {
        this.listener = listener;
        listener.next(1);
      },
      _n: (value: any) => {
        const listener = this.listener;
        listener && listener.next(value);
      },
      _e: (value: string) => {
        const listener = this.listener;
        listener && listener.error(value);
      },
      stop: () => this.listener = null,
      listener: null
    };
    const stream = xs.create(producer);

    let nextCount = 0;
    stream.take(1).addListener({
      next: (x: number) => {
        nextCount++;
        if (nextCount > 1) {
          producer._e('next should not be called more than once');
        } else {
          producer._n(x);
        }
      },
      error: (err: any) => done(err),
      complete: () => {
        done();
      }
    });
  });
});
