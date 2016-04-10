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

  it('should allow being imitated by a proxy Stream', (done) => {
    const stream = xs.periodic(100).take(3);
    const proxyStream = xs.createWithMemory();

    const expected = [0, 1, 2];
    setTimeout(() => {
      proxyStream.addListener({
        next: (x: string) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        },
      });
    }, 130);

    proxyStream.imitate(stream);
  });

  it('should be createable giving a custom producer object', (done) => {
    const expected = [10, 20, 30];
    let listenerGotEnd: boolean = false;

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
        assert.equal(listenerGotEnd, true);
      },
    });

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        listenerGotEnd = true;
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
});
