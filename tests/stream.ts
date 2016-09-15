/// <reference path="../typings/globals/mocha/index.d.ts" />
/// <reference path="../typings/globals/node/index.d.ts" />
import xs, {Producer, Listener, Stream} from '../src/index';
import * as assert from 'assert';

describe('Stream', () => {
  it('should have all the core static operators', () => {
    assert.equal(typeof xs.create, 'function');
    assert.equal(typeof xs.createWithMemory, 'function');
    assert.equal(typeof xs.never, 'function');
    assert.equal(typeof xs.empty, 'function');
    assert.equal(typeof xs.throw, 'function');
    assert.equal(typeof xs.of, 'function');
    assert.equal(typeof xs.from, 'function');
    assert.equal(typeof xs.fromArray, 'function');
    assert.equal(typeof xs.fromPromise, 'function');
    assert.equal(typeof xs.fromObservable, 'function');
    assert.equal(typeof xs.periodic, 'function');
    assert.equal(typeof xs.merge, 'function');
    assert.equal(typeof xs.combine, 'function');
  });

  it('should have all the core operators as methods, plus addListener and removeListener', () => {
    const stream = xs.create();
    assert.equal(typeof stream.addListener, 'function');
    assert.equal(typeof stream.removeListener, 'function');
    assert.equal(typeof stream.subscribe, 'function');
    assert.equal(typeof stream.map, 'function');
    assert.equal(typeof stream.mapTo, 'function');
    assert.equal(typeof stream.filter, 'function');
    assert.equal(typeof stream.take, 'function');
    assert.equal(typeof stream.drop, 'function');
    assert.equal(typeof stream.last, 'function');
    assert.equal(typeof stream.startWith, 'function');
    assert.equal(typeof stream.endWhen, 'function');
    assert.equal(typeof stream.fold, 'function');
    assert.equal(typeof stream.flatten, 'function');
    assert.equal(typeof stream.compose, 'function');
    assert.equal(typeof stream.remember, 'function');
    assert.equal(typeof stream.debug, 'function');
    assert.equal(typeof stream.imitate, 'function');
  });

  it('should be createable giving a custom producer object', (done) => {
    const expected = [10, 20, 30];
    let producerStopped: boolean = false;

    const producer: Producer<number> = {
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
    };

    const stream: Stream<number> = xs.create(producer);
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

  it('should allow using shamefullySend* methods', (done) => {
    const expected = [10, 20, 30];
    let listenerGotEnd: boolean = false;

    const stream = xs.create();

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        listenerGotEnd = true;
      },
    });

    stream.shamefullySendNext(10);
    stream.shamefullySendNext(20);
    stream.shamefullySendNext(30);
    stream.shamefullySendComplete();

    assert.equal(expected.length, 0);
    assert.equal(listenerGotEnd, true);
    done();
  });

  it('should be possible to addListener and removeListener with 1 listener', (done) => {
    const stream = xs.periodic(100);
    const expected = [0, 1, 2];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: (err: any) => done(err),
      complete: () => done('should not call complete'),
    };
    stream.addListener(listener);
  });

  it('should broadcast events to two listeners', (done) => {
    const stream = xs.periodic(100);
    const expected1 = [0, 1, 2];
    const expected2 = [1, 2];

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

  it('should not stop if listener is synchronously removed and re-added', (done) => {
    const stream = xs.periodic(100);
    const expected = [0, 1, 2];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: (err: any) => done(err),
      complete: () => done('should not call complete'),
    };
    stream.addListener(listener);

    setTimeout(() => {
      stream.removeListener(listener);
      stream.addListener(listener);
    }, 150);
  });

  it('should restart if listener is asynchronously removed and re-added', (done) => {
    const stream = xs.periodic(100);
    let expected = [0, 1, 2];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: (err: any) => done(err),
      complete: () => done('should not call complete'),
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

  it('should synchronously stop producer when completed', (done) => {
    let on = false;
    const stream = xs.create({
      start: (listener) => {
        on = true;
        listener.next(10);
        listener.next(20);
        listener.next(30);
        listener.complete();
      },
      stop: () => {
        on = false;
      },
    });
    const expected1 = [10, 20, 30];
    const expected2 = [10, 20, 30];

    stream.addListener({
      next: (x: number) => {
        assert.equal(on, true);
        assert.equal(x, expected1.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(on, false);
        assert.equal(expected1.length, 0);
      },
    });
    assert.equal(on, false);
    assert.equal(expected1.length, 0);

    stream.addListener({
      next: (x: number) => {
        assert.equal(on, true);
        assert.equal(x, expected2.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(on, false);
        assert.equal(expected2.length, 0);
      },
    });
    assert.equal(on, false);
    assert.equal(expected2.length, 0);
    done();
  });

  it('should synchronously stop producer when error thrown', (done) => {
    let on = false;
    const stream = xs.create({
      start: (listener) => {
        on = true;
        listener.next(10);
        listener.next(20);
        listener.next(30);
        listener.error('oops');
      },
      stop: () => {
        on = false;
      },
    });
    const expected1 = [10, 20, 30];
    const expected2 = [10, 20, 30];

    stream.addListener({
      next: (x: number) => {
        assert.equal(on, true);
        assert.equal(x, expected1.shift());
      },
      error: (err: any) => {
        assert.equal(err, 'oops');
        assert.equal(on, false);
        assert.equal(expected1.length, 0);
      },
      complete: () => {
        done('complete should not be called');
      },
    });
    assert.equal(on, false);
    assert.equal(expected1.length, 0);

    stream.addListener({
      next: (x: number) => {
        assert.equal(on, true);
        assert.equal(x, expected2.shift());
      },
      error: (err: any) => {
        assert.equal(err, 'oops');
        assert.equal(on, false);
        assert.equal(expected2.length, 0);
      },
      complete: () => {
        done('complete should not be called');
      },
    });
    assert.equal(on, false);
    assert.equal(expected2.length, 0);
    done();
  });

  describe('create', () => {
    it('throws a helpful error if you pass an incomplete producer', (done) => {
      try {
        const incompleteProducer = <Producer<any>> <any> {
          start: () => {},
          stop: undefined
        };

        xs.create(incompleteProducer);
      } catch (e) {
        assert.equal(e.message, 'producer requires both start and stop functions');
        done();
      }
    });
  });

  describe('setDebugListener', () => {
    it('should not trigger a stream execution', (done) => {
      const stream = xs.of(1, 2, 3);
      const listener: Listener<number> = {
        next: () => done('should not be called'),
        error: () => done('should not be called'),
        complete: () => done('should not be called'),
      };

      stream.setDebugListener(listener);
      setTimeout(() => done(), 200);
    });

    it('should spy an existing stream execution', (done) => {
      const stream = xs.periodic(200).take(8);
      const listener = { next: () => { }, error: () => { }, complete: () => { } };
      const expected = [0, 1, 2];

      const debugListener: Listener<number> = {
        next: (x: number) => {
          assert.strictEqual(x, expected.shift());
        },
        error: () => done('should not be called'),
        complete: () => done('should not be called')
      };
      stream.setDebugListener(debugListener);

      stream.addListener(listener);
      setTimeout(() => stream.removeListener(listener), 700);

      setTimeout(() => {
        assert.strictEqual(expected.length, 0);
        done();
      }, 1000);
    });
  });

  describe('addListener', () => {
    it('throws a helpful error if you forget the next function', (done) => {
      const stream = xs.empty();
      const listener = <Listener<Number>> <any> {};

      try {
        stream.addListener(listener);
      } catch (e) {
        assert.equal(e.message, 'stream.addListener() requires all three ' +
        'next, error, and complete functions.');
        done();
      }
    });

    it('throws a helpful error if you forget the error function', (done) => {
      const stream = xs.empty();
      const listener = <Listener<Number>> <any> {
        next: (x: any) => {}
      };

      try {
        stream.addListener(listener);
      } catch (e) {
        assert.equal(e.message, 'stream.addListener() requires all three ' +
        'next, error, and complete functions.');
        done();
      }
    });

    it('throws a helpful error if you forget the complete function', (done) => {
      const stream = xs.empty();
      const listener = <Listener<Number>> <any> {
        next: (x: any) => {},
        error: (err: any) => {}
      };

      try {
        stream.addListener(listener);
      } catch (e) {
        assert.equal(e.message, 'stream.addListener() requires all three ' +
        'next, error, and complete functions.');
        done();
      }
    });

    it('throws a helpful error if you pass a non function value as the next function', (done) => {
      const stream = xs.empty();
      const listener = <Listener<Number>> <any> {
        next: undefined
      };

      try {
        stream.addListener(listener);
      } catch (e) {
        assert.equal(e.message, 'stream.addListener() requires all three ' +
        'next, error, and complete functions.');
        done();
      }
    });
  });

  describe('subscribe', () => {
     it('throws a helpful error if you forget the next function', (done) => {
      const stream = xs.empty();
      const listener = <Listener<Number>> <any> {};

      try {
        stream.subscribe(listener);
      } catch (e) {
        assert.equal(e.message, 'stream.addListener() requires all three ' +
        'next, error, and complete functions.');
        done();
      }
    });

    it('throws a helpful error if you forget the error function', (done) => {
      const stream = xs.empty();
      const listener = <Listener<Number>> <any> {
        next: (x: any) => {}
      };

      try {
        stream.subscribe(listener);
      } catch (e) {
        assert.equal(e.message, 'stream.addListener() requires all three ' +
        'next, error, and complete functions.');
        done();
      }
    });

    it('throws a helpful error if you forget the complete function', (done) => {
      const stream = xs.empty();
      const listener = <Listener<Number>> <any> {
        next: (x: any) => {},
        error: (err: any) => {}
      };

      try {
        stream.subscribe(listener);
      } catch (e) {
        assert.equal(e.message, 'stream.addListener() requires all three ' +
        'next, error, and complete functions.');
        done();
      }
    });

    it('throws a helpful error if you pass a non function value as the next function', (done) => {
      const stream = xs.empty();
      const listener = <Listener<Number>> <any> {
        next: undefined
      };

      try {
        stream.subscribe(listener);
      } catch (e) {
        assert.equal(e.message, 'stream.addListener() requires all three ' +
        'next, error, and complete functions.');
        done();
      }
    });

    it('should return a subscription', (done) => {
      const stream = xs.empty();
      const noop = (): void => void 0;
      const listener = {
        next: noop,
        error: noop,
        complete: noop
      };

      const subscription = stream.subscribe(listener);

      assert.equal(typeof subscription, 'object');
      assert.equal(typeof subscription.unsubscribe, 'function');

      done();
    });
  });
});
