import xs, {Producer, Listener, Stream} from '../src/index';
import * as assert from 'assert';

describe('Stream', () => {
  it('should be createable giving a custom producer object', (done) => {
    const expected = [10, 20, 30];
    let listenerGotEnd: boolean = false;

    const producer: Producer<number> = {
      start(listener: Listener<number>) {
        listener.next(10);
        listener.next(20);
        listener.next(30);
        listener.end();
      },

      stop() {
        done();
        assert.equal(expected.length, 0);
        assert.equal(listenerGotEnd, true);
      },
    };

    const stream: Stream<number> = new Stream(producer);
    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      end: () => {
        listenerGotEnd = true;
      },
    });
  });

  it('should have all the core static operators', () => {
    assert.equal(typeof Stream.MemoryStream, 'function');
    assert.equal(typeof Stream.from, 'function');
    assert.equal(typeof Stream.of, 'function');
    assert.equal(typeof Stream.merge, 'function');
    assert.equal(typeof Stream.interval, 'function');
    assert.equal(typeof Stream.domEvent, 'function');
    assert.equal(typeof Stream.never, 'function');
    assert.equal(typeof Stream.empty, 'function');
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
    assert.equal(typeof stream.flatten, 'function');
    assert.equal(typeof stream.flattenConcurrently, 'function');
    assert.equal(typeof stream.merge, 'function');
    assert.equal(typeof stream.combine, 'function');
  });

  it('should be addListenerable and removeListenerable with one listener', (done) => {
    const stream = xs.interval(100);
    const expected = [0, 1, 2];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(listener);
  });

  it('should broadcast events to two listeners', (done) => {
    const stream = xs.interval(100);
    const expected1 = [0, 1, 2];
    const expected2 = [1, 2];

    let listener1 = {
      next: (x: number) => {
        assert.equal(x, expected1.shift());
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(listener1);

    let listener2 = {
      next: (x: number) => {
        assert.equal(x, expected2.shift());
      },
      error: done.fail,
      end: done.fail,
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

  it('should not stop if removeListenerd and re-addListenerd synchronously', (done) => {
    const stream = xs.interval(100);
    const expected = [0, 1, 2];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(listener);

    setTimeout(() => {
      stream.removeListener(listener);
      stream.addListener(listener);
    }, 150);
  });

  it('should restart if removeListenerd and re-addListenerd asynchronously', (done) => {
    const stream = xs.interval(100);
    let expected = [0, 1, 2];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done.fail,
      end: done.fail,
    };
    stream.addListener(listener);

    setTimeout(() => {
      stream.removeListener(listener);
    }, 130);
    setTimeout(() => {
      assert.equal(expected.length, 2);
      expected = [0, 1, 2];
      stream.addListener(listener);
    }, 180);
  });
});
