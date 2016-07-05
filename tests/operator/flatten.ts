/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, Listener} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.flatten', () => {
  describe('with map', () => {
    it('should expand each periodic event with 3 sync events', (done) => {
      const source: Stream<Stream<number>> = xs.periodic(100).take(3)
        .map((i: number) => xs.of(1 + i, 2 + i, 3 + i));
      const stream: Stream<number> = source.flatten();
      const expected = [1, 2, 3, 2, 3, 4, 3, 4, 5];

      stream.addListener({
        next: (x: number) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        }
      });
    });

    it('should have an ins field as metadata', (done) => {
      const source: Stream<number> = xs.periodic(100).take(3)
      const stream: Stream<number> = source
        .map((i: number) => xs.of(1 + i, 2 + i, 3 + i))
        .flatten();
      assert.strictEqual(stream['_prod']['ins'], source);
      done();
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
      const flat: Stream<boolean> = streamStrings.map(x => streamBooleans).flatten();
      done();
    });

    it('should expand 3 sync events as a periodic, only last one passes', (done) => {
      const stream = xs.fromArray([1, 2, 3])
        .map(i => xs.periodic(100 * i).take(2).map(x => `${i}${x}`))
        .flatten();
      // ---x---x---x---x---x---x
      // ---10--11
      // -------20------21
      // -----------30----------31
      const expected = ['30', '31'];

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

    it('should expand 3 async events as a periodic each', (done) => {
      const stream = xs.periodic(140).take(3)
        .map(i =>
          xs.periodic(100 * (i < 2 ? 1 : i)).take(3).map(x => `${i}${x}`)
        )
        .flatten();
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //      ----10--11--12
      //           ------------20-----------21----------22
      const expected = ['00', '10', '20', '21', '22'];

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

    it('should expand 3 async events as a periodic each, no optimization', (done) => {
      const stream = xs.periodic(140).take(3)
        .map(i =>
          xs.periodic(100 * (i < 2 ? 1 : i)).take(3).map(x => `${i}${x}`)
        )
        .filter(() => true) // breaks the optimization map+flattenConcurrently
        .flatten();
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //      ----10--11--12
      //           ------------20-----------21----------22

      const expected = ['00', '10', '20', '21', '22'];

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
      ).flatten();

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

    it('should not leak when used in a withLatestFrom-like case', (done) => {
      const a$ = xs.periodic(100);
      const b$ = xs.periodic(220);

      let innerAEmissions = 0;

      // a$.withLatestFrom(b$, (a, b) => a + b)
      const c$ = b$.map(b =>
        a$.map(a => a + b).debug(a => { innerAEmissions += 1; })
      ).flatten().take(1);

      let cEmissions = 0;
      c$.addListener({
        next: (c) => {
          assert.strictEqual(cEmissions, 0);
          assert.strictEqual(c, 0);
          cEmissions += 1;
        },
        error: (err: any) => done(err),
        complete: () => { },
      });

      setTimeout(() => {
        assert.strictEqual(innerAEmissions, 1);
        assert.strictEqual(cEmissions, 1);
        done();
      }, 800);
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
        .flatten();
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //           ------------20-----------21----------22
      const expected = ['00', '01', '20', '21', '22'];

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

  describe('with mapTo', () => {
    it('should have the correct \'type\' metadata on the operator producer', (done) => {
      const source: Stream<Stream<number>> = xs.periodic(100).take(3)
        .mapTo(xs.of(1, 2, 3));
      const stream: Stream<number> = source.flatten();
      assert.strictEqual(stream['_prod']['type'], 'mapTo+flatten');
      done();
    });
  });
});
