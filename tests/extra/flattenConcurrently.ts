/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, Listener} from '../../src/index';
import flattenConcurrently from '../../src/extra/flattenConcurrently';
import * as assert from 'assert';

describe('flattenConcurrently (extra)', () => {
  describe('with map', () => {
    it('should expand each periodic event with 3 sync events', (done) => {
      const stream = xs.periodic(100).take(3)
        .map(i => xs.of(1 + i, 2 + i, 3 + i))
        .compose(flattenConcurrently);
      const expected = [1, 2, 3, 2, 3, 4, 3, 4, 5];

      stream.addListener({
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

    it('should return a flat stream with correct TypeScript types', (done) => {
      const streamStrings: Stream<string> = Stream.create({
        start: (listener: Listener<string>) => {},
        stop: () => {}
      });

      const streamBooleans: Stream<boolean> = Stream.create({
        start: (listener: Listener<boolean>) => {},
        stop: () => {}
      });

      // Type checked by the compiler. Without Stream<boolean> it does not compile.
      const flat: Stream<boolean> = streamStrings.map(x => streamBooleans)
        .compose(flattenConcurrently);
      done();
    });

    it('should expand 3 sync events as a periodic each', (done) => {
      const stream = xs.of(0, 1, 2)
        .map(i => xs.periodic(100 * i).take(2).map(x => `${i}${x}`))
        .compose(flattenConcurrently);
      // ---x---x---x---x---x---x
      // ---00--01
      // -------10------11
      // -----------20----------21
      const expected = ['00', '01', '10', '20', '11', '21'];

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

    it('should expand 3 async events as a periodic each', (done) => {
      const stream = xs.periodic(140).take(3)
        .map(i =>
          xs.periodic(100 * (i < 2 ? 1 : i)).take(3).map(x => `${i}${x}`)
        )
        .compose(flattenConcurrently);
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //      ----10--11--12
      //           ------------20-----------21----------22
      const expected = ['00', '01', '10', '02', '11', '12', '20', '21', '22'];

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

    it('should expand 3 async events as a periodic each, no optimization', (done) => {
      const stream = xs.periodic(140).take(3)
        .map(i =>
          xs.periodic(100 * (i < 2 ? 1 : i)).take(3).map(x => `${i}${x}`)
        )
        .filter(() => true) // breaks the optimization map+flattenConcurrently
        .compose(flattenConcurrently);
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //      ----10--11--12
      //           ------------20-----------21----------22

      const expected = ['00', '01', '10', '02', '11', '12', '20', '21', '22'];

      stream.addListener({
        next: (x: string) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        }
      });
    });

    it('should propagate user mistakes in project as errors', (done) => {
      const source = xs.periodic(30).take(1);
      const stream = source.map(
        x => {
          const y = (<string> <any> x).toLowerCase();
          return xs.of(y);
        }
          ).compose(flattenConcurrently);

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
  });

  describe('with filter+map fusion', () => {
    it('should execute the predicate, the projection, and the flattening', (done) => {
      let predicateCallCount = 0;
      let projectCallCount = 0;

      const stream = xs.periodic(140).take(3)
        .filter(i => {
          predicateCallCount += 1;
          return i % 2 === 0;
        })
        .map(i => {
          projectCallCount += 1;
          return xs.periodic(100 * (i < 2 ? 1 : i)).take(3).map(x => `${i}${x}`);
        })
        .compose(flattenConcurrently);
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //           ------------20-----------21----------22
      const expected = ['00', '01', '02', '20', '21', '22'];

      stream.addListener({
        next: (x: string) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          assert.equal(predicateCallCount, 3);
          assert.equal(projectCallCount, 2);
          done();
        }
      });
    });
  });
});
