/// <reference types="mocha"/>
/// <reference types="node" />
import xs, {Stream, MemoryStream} from '../../src/index';
import periodic from '../../src/extra/periodic';
import * as assert from 'assert';

console.warn = () => {};

describe('Stream.prototype.fold', () => {
  it('should accumulating a value over time', (done: any) => {
    const stream = periodic(50).take(4).fold((x: number, y: number) => x + y, 0);
    const expected = [0, 0, 1, 3, 6];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        stream.removeListener(listener);
        done();
      },
    };
    stream.addListener(listener);
  });

  it('should propagate user mistakes in accumulate as errors', (done: any) => {
    const source = periodic(30).take(1);
    const stream = source.fold(
      (x, y) => <number> <any> (<string> <any> x).toLowerCase(),
      0
    );
    const expected = [0];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err) => {
        assert.equal(expected.length, 0);
        assert.notStrictEqual(err.message.match(/is not a function$/), null);
        done();
      },
      complete: () => {
        done('complete should not be called');
      },
    });
  });

  it('should return a MemoryStream if input stream is a Stream', (done: any) => {
    const input = xs.of<number>(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: MemoryStream<number> = input.fold((acc, x) => acc + x, 0);
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  });

  it('should return a MemoryStream if input stream is a MemoryStream', (done: any) => {
    const input = xs.of<number>(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: MemoryStream<number> = input.fold((acc, x) => acc + x, 0);
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();;
  })
});
