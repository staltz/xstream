/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Producer, Listener, Stream, MemoryStream} from '../../src/index';
import delay from '../../src/extra/delay';
import * as assert from 'assert';

describe('Stream.prototype.imitate', () => {
  it('should be able to model a circular dependency in the stream graph', (done) => {
    const fakeSecond = xs.create<number>();
    const first = fakeSecond.map(x => x * 10).take(3);
    const second = first.map(x => x + 1).startWith(1).compose(delay<number>(1));
    fakeSecond.imitate(second);
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

  it('should not cause leaked cyclic executions', (done) => {
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
});
