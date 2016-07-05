/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Producer, Listener, Stream, MemoryStream} from '../../src/index';
import delay from '../../src/extra/delay';
import * as assert from 'assert';

describe('Stream.prototype.imitate', () => {
  it('should be able to model a circular dependency in the stream graph', (done) => {
    const secondMimic = xs.create<number>();
    const first = secondMimic.map(x => x * 10).take(3);
    const second = first.map(x => x + 1).startWith(1).compose(delay<number>(1));
    secondMimic.imitate(second);
    const expected = [1, 11, 111, 1111];

    second.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should be able to model a circular dependency, mimic subscribed', (done) => {
    const secondMimic = xs.create<number>();
    const first = secondMimic.map(x => x * 10).take(3);
    const second = first.map(x => x + 1).startWith(1).compose(delay<number>(1));
    secondMimic.imitate(second);
    const expected = [1, 11, 111, 1111];

    secondMimic.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should broadcast the source stream to multiple listeners', (done) => {
    const fakeSecond = xs.create<number>();
    const first = fakeSecond.map(x => x * 10).take(3);
    const second = first.map(x => x + 1).startWith(1).compose(delay<number>(100));
    fakeSecond.imitate(second);

    const expected1 = [1, 11, 111, 1111];
    const expected2 = [11, 111, 1111];
    let completed1 = false;
    let completed2 = false;

    let listener1 = {
      next: (x: number) => {
        assert.equal(x, expected1.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        completed1 = true;
      }
    };
    fakeSecond.addListener(listener1);
    second.addListener({ next: () => { }, error: () => { }, complete: () => { } });

    let listener2 = {
      next: (x: number) => {
        assert.equal(x, expected2.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        completed2 = true;
      }
    };
    setTimeout(() => {
      fakeSecond.addListener(listener2);
    }, 150);

    setTimeout(() => {
      fakeSecond.removeListener(listener1);
      fakeSecond.removeListener(listener2);
      assert.equal(expected1.length, 0);
      assert.equal(expected2.length, 0);
      assert.equal(completed1, true);
      assert.equal(completed2, true);
      done();
    }, 600);
  });

  it('should not cause leaked cyclic executions (1)', (done) => {
    const expectedProxy = [2, 4, 8, 16, 32 /* inertia due to stopping on next tick */];
    const expectedResult = [2, 4, 8, 16];

    const proxy$ = xs.create<number>();
    const source$ = proxy$.startWith(1).map(x => x * 2)
      .debug(x => {
        try {
          assert.equal(expectedProxy.length > 0, true,
            'should be expecting the next value ' + x);
          assert.equal(x, expectedProxy.shift());
        } catch (err) {
          done(err);
        }
      });
    const result$ = source$.compose(delay(100)).compose(s => <Stream<number>> s);
    proxy$.imitate(result$);

    result$.take(4).addListener({
      next: (x: number) => {
        assert.equal(x, expectedResult.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expectedProxy.length, 1); // still waiting for 32
        assert.equal(expectedResult.length, 0);
        setTimeout(() => {
          done();
        }, 1000);
      },
    });
  });

  it('should not cause leaked cyclic executions (2)', (done) => {
    const expectedProxy = [2, 4, 8, 16, 32 /* inertia due to stopping on next tick */];
    const expectedResult = [2, 4, 8, 16];

    const proxy$ = xs.create<number>();
    const source$ = proxy$.startWith(1).map(x => x * 2)
      .debug(x => {
        try {
          assert.equal(expectedProxy.length > 0, true,
            'should be expecting the next value ' + x);
          assert.equal(x, expectedProxy.shift());
        } catch (err) {
          done(err);
        }
      });
    const result$ = source$.compose(delay(100)).compose(s => <Stream<number>> s);
    proxy$.imitate(result$)

    source$.take(4).addListener({
      next: (x: number) => {
        assert.equal(x, expectedResult.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expectedProxy.length, 1); // still waiting for 32
        assert.equal(expectedResult.length, 0);
        setTimeout(() => {
          done();
        }, 1000);
      },
    });
  });

  it('should not cause stack overflow while detecting cycles', (done) => {
    const outside = xs.periodic(150);
    const secondMimic = xs.create<number>();
    const first = xs.merge(outside, secondMimic.map(x => x * 10));
    const second = first.map(x => x + 1).compose(delay<number>(100));
    secondMimic.imitate(second);
    const expectedSecond1 = [1];
    const expectedSecond4 = [1, 11, 2, 111];
    const expectedOutside = [0, 1];
    let completedSecond1 = false;
    let completedSecond4 = false;
    let completedOutside = false;

    second.take(1).addListener({
      next: (x: number) => {
        assert.equal(x, expectedSecond1.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        completedSecond1 = true;
      },
    });

    second.take(4).addListener({
      next: (x: number) => {
        assert.equal(x, expectedSecond4.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        completedSecond4 = true;
      },
    });

    outside.take(2).addListener({
      next: (x: number) => {
        assert.equal(x, expectedOutside.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        completedOutside = true;
      },
    });

    setTimeout(() => {
      assert.equal(expectedSecond1.length, 0);
      assert.equal(expectedSecond4.length, 0);
      assert.equal(expectedOutside.length, 0);
      assert.equal(completedSecond1, true);
      assert.equal(completedSecond4, true);
      assert.equal(completedOutside, true);
      done();
    }, 1000);
  });

  it('should not propagate errors in a cycle', (done) => {
    const proxyAction$ = xs.create<number>();
    const state$ = proxyAction$.fold((state, action) => state + action, 0);
    const action$ = state$.map(state => {
      if (state === 3) {
        throw new Error(':(');
      }
      return xs.of(1).compose(delay<number>(20));
    }).flatten();
    proxyAction$.imitate(action$);
    const expected = [0, 1, 2];

    let errors: Array<any> = [];
    state$.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => {
        errors.push(err);
      },
      complete: () => {
        done('complete should not be called');
      },
    });

    setTimeout(() => {
      assert.equal(errors.length, 1);
      assert.equal(expected.length, 0);
      done();
    }, 150);
  });

  it('should not by itself start the target stream execution', (done) => {
    let nextDelivered = false;
    const stream = xs.periodic(50).take(3).debug(() => {
      nextDelivered = true;
    });
    const proxyStream = xs.create<number>();

    setTimeout(() => {
      assert.equal(nextDelivered, false);
      done();
    }, 125);

    proxyStream.imitate(stream);
  });

  it('should throw an error when given a MemoryStream', (done) => {
    const stream = xs.periodic(50).take(3).remember();
    assert.strictEqual(stream instanceof MemoryStream, true);
    const proxyStream = xs.create<number>();
    assert.throws(() => {
      proxyStream.imitate(stream);
    });
    done();
  });

  it('should transfer existing listeners to imitation target', (done) => {
    const mimic = xs.create<number>();
    const expected = [0, 1, 2];

    mimic.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });

    mimic.imitate(xs.periodic(50).take(3));
  });
});
