/// <reference path="../typings/globals/mocha/index.d.ts" />
/// <reference path="../typings/globals/node/index.d.ts" />
import xs, {Producer, Listener, Stream, MimicStream} from '../src/index';
import delay from '../src/extra/delay';
import * as assert from 'assert';

describe('MimicStream', () => {
  it('should be creatable with xs.createMimic()', (done) => {
    const stream: MimicStream<number> = xs.createMimic<number>();
    assert.equal(typeof stream.map, 'function');
    assert.equal(typeof stream.take, 'function');
    assert.equal(typeof stream.filter, 'function')
    done();
  });

  it('should imitate the given stream and send events to dependent streams', (done) => {
    const stream = xs.periodic(50).take(3);
    const proxyStream = xs.createMimic<number>();
    const result = proxyStream.map(x => x * 10 + 1);
    proxyStream.imitate(stream);

    const expected = [1, 11, 21];
    setTimeout(() => {
      result.addListener({
        next: (x: number) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        },
      });
    }, 125);
  });

  it('should be able to model a circular dependency in the stream graph', (done) => {
    const fakeSecond = xs.createMimic<number>();
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
    const source = xs.periodic(100).take(3);
    const mimic = xs.createMimic();
    mimic.imitate(source);
    const expected1 = [0, 1, 2];
    const expected2 = [1, 2];
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
    mimic.addListener(listener1);

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
      mimic.addListener(listener2);
    }, 150);

    setTimeout(() => {
      mimic.removeListener(listener1);
      mimic.removeListener(listener2);
      assert.equal(expected1.length, 0);
      assert.equal(expected2.length, 0);
      assert.equal(completed1, true);
      assert.equal(completed2, true);
      done();
    }, 400);
  });

  it('should not create leaked cyclic executions', (done) => {
    const expectedMimic = [2, 4, 8, 16];
    const expectedResult = [2, 4, 8, 16];

    const proxy$ = xs.createMimic<number>();
    const source$ = proxy$.startWith(1).map(x => x * 2)
      .debug(x => {
        assert.equal(expectedMimic.length > 0, true);
        assert.equal(x, expectedMimic.shift());
      });
    const result$ = source$.compose(delay(100)).compose(s => <Stream<number>> s);
    proxy$.imitate(result$)

    result$.take(4).addListener({
      next: (x: number) => {
        assert.equal(x, expectedResult.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expectedMimic.length, 0);
        assert.equal(expectedResult.length, 0);
        setTimeout(() => {
          done();
        }, 1000);
      },
    });
  });
});
