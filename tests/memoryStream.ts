/// <reference path="../typings/globals/mocha/index.d.ts" />
/// <reference path="../typings/globals/node/index.d.ts" />
import xs, {Producer, Listener, Stream} from '../src/index';
import * as assert from 'assert';

const noop = () => {};

describe('MemoryStream', () => {
  it('should allow use like a subject, from xs.createWithMemory()', (done) => {
    const stream = xs.createWithMemory();

    stream.shamefullySendNext(1);

    stream.addListener({
      next(x: any) {
        assert.strictEqual(x, 1);
      },
      error: (err: any) => done(err),
      complete: done,
    });

    stream.shamefullySendComplete();
  });

  it('should be createable giving a custom producer object', (done) => {
    const expected = [10, 20, 30];
    let producerStopped: boolean = false;

    const stream = xs.createWithMemory({
      start(listener: Listener<number>) {
        listener.next(10);
        listener.next(20);
        listener.next(30);
        listener.complete();
      },

      stop() {
        done();
        assert.equal(expected.length, 0);
        assert.equal(producerStopped, false);
        producerStopped = true;
      },
    });

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(producerStopped, true);
      },
    });
  });

  it('should broadcast the producer to multiple listeners', (done) => {
    const stream = xs.createWithMemory({
      start(listener: Listener<number>) {
        setTimeout(() => listener.next(0), 100);
        setTimeout(() => listener.next(1), 200);
        setTimeout(() => listener.next(2), 300);
      },

      stop() {},
    });
    const expected1 = [0, 1, 2];
    const expected2 = [0, 1, 2];

    let listener1 = {
      next: (x: number) => {
        assert.equal(x, expected1.shift());
      },
      error: (err: any) => done(err),
      complete: () => done('should not call complete'),
    };
    stream.addListener(listener1);

    let listener2 = {
      next: (x: number) => {
        assert.equal(x, expected2.shift());
      },
      error: (err: any) => done(err),
      complete: () => done('should not call complete'),
    };
    setTimeout(() => {
      stream.addListener(listener2);
    }, 150);

    setTimeout(() => {
      stream.removeListener(listener1);
      stream.removeListener(listener2);
      assert.equal(expected1.length, 0);
      assert.equal(expected2.length, 0);
      done();
    }, 400);
  });

  it('should reset completely after it has completed', (done) => {
    const stream = xs.createWithMemory({
      start(listener: Listener<number>) {
        listener.next(1);
        listener.next(2);
        listener.next(3);
        listener.complete();
      },
      stop() {},
    });

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

  it('should teardown upstream MemoryStream memory on late async stop', (done) => {
    const stream = xs.periodic(500).mapTo('world').startWith('hello').take(2);
    const expected1 = ['hello', 'world'];

    function addSecondListener() {
      const expected2 = ['hello', 'world'];
      stream.addListener({
        next: (x: string) => {
          assert.strictEqual(x, expected2.shift());
        },
        error: (err: any) => done(err),
        complete: () => done(),
      });
    }

    stream.addListener({
      next: (x: string) => {
        assert.equal(x, expected1.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected1.length, 0);
        setTimeout(addSecondListener, 200);
      },
    });
  });

  /**
   * When an operator listener is about to be added to a memory stream, the
   * operator will synchronously receive the remembered value, and may
   * synchronously remove itself from the memory stream. This happens in the
   * case of e.g. take(). In those cases, the operator should NOT be added AFTER
   * it just "got the remembered value and removed itself", because that would
   * create leaky executions of the stream. This was reported as bug #53 in
   * GitHub.
   */
  it('should not allow an operator listener to be indefinitely attached', (done) => {
    let debugCalled = 0;
    const debugExpected = [42, 0];
    const source$ = xs.periodic(100).startWith(42)
      .debug(x => {
        debugCalled += 1;
        assert.strictEqual(debugExpected.length > 0, true);
        assert.strictEqual(x, debugExpected.shift());
      });

    const expectedA = [42, 0];
    const expectedB = [42];
    let completeCalled = 0;

    source$.take(2).addListener({
      next: (x) => {
        assert.strictEqual(x, expectedA.shift());
      },
      error: (err) => {},
      complete: () => {
        completeCalled += 1;
      },
    });

    source$.take(1).addListener({
      next: (x) => {
        assert.strictEqual(x, expectedB.shift());
      },
      error: (err) => {},
      complete: () => {
        completeCalled += 1;
      }
    });

    setTimeout(() => {
      assert.strictEqual(debugExpected.length, 0);
      assert.strictEqual(expectedA.length, 0);
      assert.strictEqual(expectedB.length, 0);
      assert.strictEqual(completeCalled, 2);
      assert.strictEqual(debugCalled, 2);
      done();
    }, 500);
  });

  it('should emit remembered value also when cancelling a stop', (done) => {
    const expectedA = [1];
    const expectedB = [1, 2];
    let completeCalled = 0;
    let doneCalled = 0;

    const source$ = xs.createWithMemory({
      start(listener: Listener<number>) {
        listener.next(1);
        setTimeout(() => {
          listener.next(2);
          listener.complete();
        }, 100);
      },
      stop() {
        doneCalled += 1;
      },
    });

    const listenerA = {
      next: (x: number) => {
        assert.strictEqual(x, expectedA.shift());
        source$.removeListener(listenerA);
      },
      error: (err: any) => {},
      complete: () => {
        completeCalled += 1;
      },
    };

    source$.addListener(listenerA);

    source$.addListener({
      next: (x) => {
        assert.strictEqual(x, expectedB.shift());
      },
      error: (err) => {},
      complete: () => {
        completeCalled += 1;
      }
    });

    setTimeout(() => {
      assert.strictEqual(expectedA.length, 0);
      assert.strictEqual(expectedB.length, 0);
      assert.strictEqual(completeCalled, 1);
      assert.strictEqual(doneCalled, 1);
      done();
    }, 300);
  });
});
