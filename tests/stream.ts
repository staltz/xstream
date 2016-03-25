import xs, {Producer, Listener, Stream} from '../src/index';
import * as assert from 'assert';

describe('Stream', () => {
  it('should be createable giving a custom producer object', (done) => {
    const expected = [10, 20, 30];
    let observerGotEnd: boolean = false;

    const producer: Producer<number> = {
      start(observer: Listener<number>) {
        observer.next(10);
        observer.next(20);
        observer.next(30);
        observer.end();
      },

      stop() {
        done();
        assert.equal(expected.length, 0);
        assert.equal(observerGotEnd, true);
      },
    };

    const stream: Stream<number> = new Stream(producer);
    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      end: () => {
        observerGotEnd = true;
      },
    });
  });

  it('should have all the core operators as methods, plus addListener and removeListener', () => {
    const emptyProducer = {
      start(): void { return undefined; },
      stop(): void { return undefined; },
    };
    const stream = new Stream(emptyProducer);
    assert.equal(typeof stream.addListener, 'function');
    assert.equal(typeof stream.removeListener, 'function');
    assert.equal(typeof stream.map, 'function');
    assert.equal(typeof stream.filter, 'function');
    assert.equal(typeof stream.take, 'function');
    assert.equal(typeof stream.skip, 'function');
    assert.equal(typeof stream.debug, 'function');
    assert.equal(typeof stream.fold, 'function');
    assert.equal(typeof stream.last, 'function');
    assert.equal(typeof stream.remember, 'function');
    assert.equal(typeof stream.startWith, 'function');
  });

  it('should be addListenerable and removeListenerable with one observer', (done) => {
    const stream = xs.interval(100);
    const expected = [0, 1, 2];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(observer);
          done();
        }
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(observer);
  });

  it('should broadcast events to two observers', (done) => {
    const stream = xs.interval(100);
    const expected1 = [0, 1, 2];
    const expected2 = [1, 2];

    let observer1 = {
      next: (x: number) => {
        assert.equal(x, expected1.shift());
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(observer1);

    let observer2 = {
      next: (x: number) => {
        assert.equal(x, expected2.shift());
      },
      error: done.fail,
      end: done.fail,
    };
    setTimeout(() => {
      stream.addListener(observer2);
    }, 150);

    setTimeout(() => {
      stream.removeListener(observer1);
      stream.removeListener(observer2);
      assert.equal(expected1.length, 0);
      assert.equal(expected2.length, 0);
      done();
    }, 400);
  });

  it('should not stop if removeListenerd and re-addListenerd synchronously', (done) => {
    const stream = xs.interval(100);
    const expected = [0, 1, 2];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(observer);
          done();
        }
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(observer);

    setTimeout(() => {
      stream.removeListener(observer);
      stream.addListener(observer);
    }, 150);
  });

  it('should restart if removeListenerd and re-addListenerd asynchronously', (done) => {
    const stream = xs.interval(100);
    let expected = [0, 1, 2];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(observer);
          done();
        }
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(observer);

    setTimeout(() => {
      stream.removeListener(observer);
    }, 130);
    setTimeout(() => {
      assert.equal(expected.length, 2);
      expected = [0, 1, 2];
      stream.addListener(observer);
    }, 180);
  });
});
