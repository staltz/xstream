/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream} from '../../src/index';
import * as assert from 'assert';

describe('xs.combine', () => {
  it('should combine AND-style two streams together', (done) => {
    const stream1 = xs.periodic(100).take(2);
    const stream2 = xs.periodic(120).take(2);
    const stream = xs.combine(stream1, stream2);
    let expected = [[0,0], [1,0], [1,1]];
    stream.addListener({
      next: (x) => {
        const e = expected.shift();
        assert.equal(x[0], e[0]);
        assert.equal(x[1], e[1]);
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should have correct TypeScript signature', (done) => {
    const stream1 = xs.create<string>({
      start: listener => {},
      stop: () => {}
    });

    const stream2 = xs.create<string>({
      start: listener => {},
      stop: () => {}
    });

    const combined: Stream<[string, string]> = xs.combine(stream1, stream2);
    done();
  });

  it('should complete only when all member streams have completed', (done) => {
    const stream1 = xs.periodic(30).take(1);
    const stream2 = xs.periodic(50).take(4);
    const stream = xs.combine(stream1, stream2).map(arr => arr.join(''))
    let expected = ['00', '01', '02', '03'];
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

  it('should emit an empty array if combining zero streams', (done) => {
    const stream = xs.combine();

    stream.addListener({
      next: (a) => {
        assert.equal(Array.isArray(a), true);
        assert.equal(a.length, 0);
      },
      error: done,
      complete: () => {
        done();
      },
    });
  });

  it('should just wrap the value if combining one stream', (done) => {
    const source = xs.periodic(100).take(3);
    const stream = xs.combine(source);
    let expected = [[0], [1], [2]];

    stream.addListener({
      next: (x) => {
        const e = expected.shift();
        assert.equal(x[0], e[0]);
      },
      error: done,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should not break future listeners when CombineProducer tears down', (done) => {
    //     --0--1-2--|  innerA
    //     ---0---1--|  innerB
    // ----0----1-2--|  outer
    const innerA = xs.create<number>();
    const innerB = xs.create<number>();
    const outer = xs.create<number>();
    const arrayInners: Array<Stream<number>> = [];
    const stream = outer
      .map(x => {
        return xs.combine(...arrayInners)
          .map(combination => `${x}${combination.join('')}`);
      })
      .flatten();
    const expected = ['00'];

    setTimeout(() => {
      arrayInners.push(innerA);
      outer.shamefullySendNext(0);
    }, 100);
    setTimeout(() => {
      innerA.shamefullySendNext(0);
    }, 150);
    setTimeout(() => {
      innerB.shamefullySendNext(0);
    }, 175);
    setTimeout(() => {
      arrayInners.push(innerB);
      outer.shamefullySendNext(1);
      innerA.shamefullySendNext(1);
    }, 200);
    setTimeout(() => {
      innerA.shamefullySendNext(2);
      outer.shamefullySendNext(2);
      innerB.shamefullySendNext(1);
    }, 250);
    setTimeout(() => {
      innerA.shamefullySendComplete();
      innerB.shamefullySendComplete();
      outer.shamefullySendComplete();
    }, 550);

    stream.addListener({
      next: (x: string) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should return a Stream when combining a MemoryStream with a Stream', (done) => {
    const input1 = xs.periodic(50).take(4).remember();
    const input2 = xs.periodic(80).take(3);
    const stream: Stream<[number, number]> = xs.combine(input1, input2);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a Stream when combining a MemoryStream with a MemoryStream', (done) => {
    const input1 = xs.periodic(50).take(4).remember();
    const input2 = xs.periodic(80).take(3).remember();
    const stream: Stream<[number, number]> = xs.combine(input1, input2);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });
});
