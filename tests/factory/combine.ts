/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream} from '../../src/index';
import * as assert from 'assert';

describe('xs.combine', () => {
  it('should combine AND-style two streams together', (done) => {
    const stream1 = xs.periodic(100).take(2);
    const stream2 = xs.periodic(120).take(2);
    const stream = xs.combine((x, y) => `${x}${y}`, stream1, stream2);
    let expected = ['00', '10', '11'];
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

  it('should have correct TypeScript signature', (done) => {
    const stream1 = xs.create<string>({
      start: listener => {},
      stop: () => {}
    });

    const stream2 = xs.create<string>({
      start: listener => {},
      stop: () => {}
    });

    const combined = xs.combine(
      (a, b) => a.slice(2) + b.slice(2),
      stream1, stream2
    );
    done();
  });

  it('should complete only when all member streams have completed', (done) => {
    const stream1 = xs.periodic(30).take(1);
    const stream2 = xs.periodic(50).take(4);
    const stream = xs.combine((x, y) => `${x}${y}`, stream1, stream2);
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

  it('should propagate user mistakes in project as errors', (done) => {
    const stream1 = xs.periodic(30).take(1);
    const stream2 = xs.periodic(50).take(4);
    const stream = xs.combine(
      (x, y) => <number> <any> (<string> <any> x).toLowerCase(),
      stream1, stream2
    );
    stream.addListener({
      next: () => done('next should not be called'),
      error: (err) => {
        assert.notStrictEqual(err.message.match(/is not a function$/), null);
        done();
      },
      complete: () => {
        done('complete should not be called');
      },
    });
  });

  it('should handle a group of zero streams', (done) => {
    const stream = xs.combine<string>(() => 'hi');
    let expected = ['hi'];

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
        return xs.combine(
          (...args: Array<number>) => '' + x + args.join(''),
          ...arrayInners
        );
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
});
