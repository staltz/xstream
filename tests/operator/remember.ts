import xs from '../../src/index';
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
});
