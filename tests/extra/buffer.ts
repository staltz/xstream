/// <reference types="mocha"/>
/// <reference types="node" />
import xs from '../../src/index';
import buffer from '../../src/extra/buffer';
import delay from '../../src/extra/delay';
import periodic from '../../src/extra/periodic';
import * as assert from 'assert';

console.warn = () => {};

describe('buffer (extra)', () => {
  it('should complete when separator is completed before the source', (done) => {
    const source = xs.empty().compose(delay(20));
    const separator = xs.empty().compose(delay(10));
    const buffered = source.compose(buffer(separator));

    let separatorComplete = false;

    separator.addListener({
      complete() {
        separatorComplete = true;
      }
    });

    buffered.addListener({
      next() {
        done('should not emit');
      },
      error(e) {
        done(`should not throw ${e}`);
      },
      complete() {
        assert(separatorComplete);
        done();
      }
    });
  });

  it('should flush and complete when source is completed', (done) => {
    const source = xs.of(1, 2).compose(delay(10));
    const separator = xs.empty().compose(delay(50));
    const buffered = source.compose(buffer(separator));
    const expected = [[1, 2]];

    let separatorComplete = false;

    separator.addListener({
      complete() {
        separatorComplete = true;
      }
    });

    buffered.addListener({
      next(buff: Array<any>) {
        assert.deepEqual(buff, expected.shift());
      },
      error(e) {
        done(`should not throw ${e}`);
      },
      complete() {
        assert.strictEqual(expected.length, 0);
        assert.strictEqual(separatorComplete, false);
        done();
      }
    });
  });

  it('should emit when separator is completed', (done) => {
    const source = periodic(20).take(5);
    const separator = xs.empty().compose(delay(150));
    const buffered = source.compose(buffer(separator));
    const expected = [[0, 1, 2, 3, 4]];

    buffered.addListener({
      next(buff) {
        assert.deepEqual(buff, expected.shift());
      },
      error(e) {
        done(`should not throw ${e}`);
      },
      complete() {
        assert.equal(expected.length, 0);
        done();
      }
    });
  });

  it('should accumulate what source emits and emit when separator emits', (done) => {
    const source = periodic(100).take(10);
    const separator = periodic(350).take(3);
    const buffered = source.compose(buffer(separator));
    const expected = [[0, 1, 2], [3, 4, 5], [6, 7, 8, 9]];

    buffered.addListener({
      next(buff) {
        assert.deepEqual(buff, expected.shift());
      },
      error(e) {
        done(`should not throw ${e}`);
      },
      complete() {
        assert.equal(expected.length, 0);
        done();
      }
    });
  });

  it('should not emit empty buffers', (done) => {
    const source = xs.of(1).compose(delay(100));
    const separator = periodic(20).take(5);
    const buffered = source.compose(buffer(separator));
    const expected = [[1]];

    buffered.addListener({
      next(buff) {
        assert.deepEqual(buff, expected.shift());
      },
      error(e) {
        done(`should not throw ${e}`);
      },
      complete() {
        assert.equal(expected.length, 0);
        done();
      }
    });
  });

  it('should throw when source throws', (done) => {
    const source = xs.create({
      start(listener) {
        listener.error('boom!');
      },
      stop() {
      }
    });
    const separator = xs.empty().compose(delay(20));
    const buffered = source.compose(buffer(separator));

    buffered.addListener({
      next() {
        done('should not emit');
      },
      error(e) {
        assert(e == 'boom!');
        done();
      },
      complete() {
        done('should not complete');
      }
    });
  });

  it('should throw when separator throws', (done) => {
    const source = xs.of(1, 2, 3).compose(delay(20));
    const separator = xs.create({
      start(listener) {
        listener.error('boom!');
      },
      stop() { }
    });
    const buffered = source.compose(buffer(separator));

    buffered.addListener({
      next() {
        done('should not emit');
      },
      error(e) {
        assert.ok(e);
        done();
      },
      complete() {
        done('should not complete');
      }
    });
  });
});
