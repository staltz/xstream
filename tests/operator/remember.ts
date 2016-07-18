/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';
function noop() {};

describe('Stream.prototype.remember', () => {
  it('should replay the second event to a new listener', (done) => {
    const stream = xs.periodic(50).take(4).remember();

    stream.addListener({next: noop, error: noop, complete: noop});

    let expected = [1, 2, 3];
    setTimeout(() => {
      stream.addListener({
        next(x) {
          assert.strictEqual(x, expected.shift());
        },
        error: done,
        complete: () => {
          assert.strictEqual(expected.length, 0);
          done();
        }
      });
    }, 125);
  });

  it('should not be ruined by map+map fusion optimizations', (done) => {
    let expectedA = [10];
    let expectedB = [10];

    const source = xs.never().endWhen(xs.periodic(300))
      .fold((acc, x) => acc + x, 10)
      .map(x => x)
      .remember();

    // WOULD make a map+map fusion if remember()
    // would just use its parent producer.
    const streamA = source.map(x => x);

    const streamB = source
      .debug(x => { assert.strictEqual(x, expectedB.shift()); })

    streamA.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expectedA.shift());
      },
      error: noop,
      complete: noop,
    });

    setTimeout(() => {
      streamB.addListener({
        next: noop,
        error: done,
        complete: () => {
          assert.strictEqual(expectedA.length, 0);
          assert.strictEqual(expectedB.length, 0);
          done();
        }
      });
    }, 100);
  });

  it('should reset completely after it has completed', (done) => {
    const stream = xs.of(1, 2, 3).remember();

    const expected1 = [1, 2, 3];
    let completed1 = false;
    const expected2 = [1, 2, 3];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected1.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        completed1 = true;
      },
    });

    assert.strictEqual(expected1.length, 0);
    assert.strictEqual(completed1, true);

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected2.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected2.length, 0);
        done();
      },
    });
  });

  it('should return a MemoryStream if input stream is a Stream', (done) => {
    const input = xs.of(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: MemoryStream<number> = input.remember();
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  })

  it('should not fail if original stream has no producer, and start is called', (done) => {
    const input = xs.create<number>();
    assert.strictEqual(input instanceof Stream, true);
    const stream: MemoryStream<number> = input.remember();
    assert.strictEqual(stream instanceof MemoryStream, true);
    assert.doesNotThrow(() => {
      stream.addListener({ next: () => { }, error: () => { }, complete: () => { } });
    });
    done();
  });

  it('should return a MemoryStream if input stream is a MemoryStream', (done) => {
    const input = xs.createWithMemory<number>();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: MemoryStream<number> = input.remember();
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  });

  it('should be a true bypass if input stream is a MemoryStream', (done) => {
    const input = xs.createWithMemory<number>();
    const stream: MemoryStream<number> = input.remember();
    assert.strictEqual(stream, input);
    done();
  });

  it('should not fail if original memorystream has no producer, and start is called', (done) => {
    const input = xs.createWithMemory<number>();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: MemoryStream<number> = input.remember();
    assert.strictEqual(stream instanceof MemoryStream, true);
    assert.doesNotThrow(() => {
      stream.addListener({ next: () => { }, error: () => { }, complete: () => { } });
    });
    done();
  });

  it('should pass last value to second listener, even if it\'s "shameful"', (done) => {
    const subject = xs.create();
    const remembered = subject.remember();

    remembered.addListener({next: noop, error: noop, complete: noop});
    subject.shamefullySendNext('foo');

    let expected = ['foo'];
    remembered.addListener({
      next(x) {
        assert.strictEqual(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });

    subject.shamefullySendComplete();
  });

  it('should work properly with "shameful" values after subscription', (done) => {
    const subject = xs.create();
    const remembered = subject.remember();

    let expected = ['foo'];
    remembered.addListener({
      next(x) {
        assert.strictEqual(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });

    subject.shamefullySendNext('foo');
    subject.shamefullySendComplete();
  });
});
