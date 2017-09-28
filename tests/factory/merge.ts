/// <reference types="mocha"/>
/// <reference types="node" />
import xs, {Stream} from '../../src/index';
import periodic from '../../src/extra/periodic';
import * as assert from 'assert';

console.warn = () => {};

describe('xs.merge', () => {
  it('should merge OR-style two streams together', (done: any) => {
    const stream = xs.merge(
      periodic(100).take(2),
      periodic(120).take(2)
    );
    let expected = [0, 0, 1, 1];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should complete only when all member streams have completed', (done: any) => {
    const stream1 = periodic(30).take(1);
    const stream2 = periodic(50).take(4);
    const stream = xs.merge(stream1, stream2);
    let expected = [0, 0, 1, 2, 3];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should complete properly when stopped asynchronously and restarted synchronously', (done: any) => {
    const initial = xs.of('foo');
    const stream = xs.merge(initial);

    const noop = () => {};
    stream.addListener({next: noop, error: noop, complete: noop});

    let expected = ['foo'];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      }
    });
  });

  it('should return a Stream when merging a MemoryStream with a Stream', (done: any) => {
    const input1 = periodic(50).take(4).remember();
    const input2 = periodic(80).take(3);
    const stream: Stream<number> = xs.merge(input1, input2);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a Stream when merging a MemoryStream with a MemoryStream', (done: any) => {
    const input1 = periodic(50).take(4).remember();
    const input2 = periodic(80).take(3).remember();
    const stream: Stream<number> = xs.merge(input1, input2);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should have a correct TypeScript signature', () => {
    const bools = xs.create<boolean>({
      start: listener => {},
      stop: () => {}
    });

    const numbers = xs.create<number>({
      start: listener => {},
      stop: () => {}
    });

    const strings = xs.create<string>({
      start: listener => {},
      stop: () => {}
    });

    const emptyIsh: Stream<boolean> = xs.merge<boolean>();
    const doubled: Stream<boolean | string> = xs.merge(bools, strings);
    const tripled: Stream<boolean | number | string> = xs.merge(bools, strings, numbers);
  });
});
