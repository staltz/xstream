/// <reference types="mocha"/>
/// <reference types="node" />
import xs, {Stream, MemoryStream} from '../../src/index';
import delay from '../../src/extra/delay';
import periodic from '../../src/extra/periodic';
import * as assert from 'assert';

console.warn = () => {};

describe('Stream.prototype.endWhen', () => {
  it('should complete the stream when another stream emits next', (done: any) => {
    const source = periodic(50);
    const other = periodic(220).take(1);
    const stream = source.endWhen(other);
    const expected = [0, 1, 2, 3];

    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      },
    });
  });

  it('should complete the stream when another stream emits complete', (done: any) => {
    const source = periodic(50);
    const other = xs.empty().compose(delay(220));
    const stream = source.endWhen(other);
    const expected = [0, 1, 2, 3];

    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      },
    });
  });

  it('should return a Stream if input stream is a Stream', (done: any) => {
    const input = xs.of<number>(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: Stream<number> = input.endWhen(xs.never());
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a MemoryStream if input stream is a MemoryStream', (done: any) => {
    const input = xs.of<number>(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: MemoryStream<number> = input.endWhen(xs.never());
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  });
});
