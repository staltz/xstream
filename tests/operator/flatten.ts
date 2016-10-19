/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, Listener} from '../../src/index';
import fromDiagram from '../../src/extra/fromDiagram';
import * as assert from 'assert';

describe('Stream.prototype.flatten', () => {
  describe('with map+debug to break the fusion', () => {
    it('should not restart inner stream if switching to the same inner stream', (done) => {
      const outer = fromDiagram('-A---------B----------C--------|');
      const nums = fromDiagram(  '-a-b-c-----------------------|', {
        values: {a: 1, b: 2, c: 3}
      });
      const inner = nums.map(x => 10 * x);

      const stream = outer.map(() => inner).debug(() => { }).flatten();

      const expected = [10, 20, 30];

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
  });

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
      const source: Stream<number> = xs.periodic(100).take(3);
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

    it('should not error when stopping, and outer stream was empty', (done) => {
      const outer = xs.never();
      const stream = outer.map(x => xs.of(1, 2, 3)).flatten();
      const listener = {
        next: () => {},
        error: () => {},
        complete: () => {},
      };

      assert.doesNotThrow(() => {
        stream.addListener(listener);
        stream.removeListener(listener);
      });

      setTimeout(() => done(), 500);
    });

    it('should allow switching inners asynchronously without restarting source', (done) => {
      const outer = fromDiagram(   '-A---------B----------C------|');
      const periodic = fromDiagram('---a-b--c----d--e--f----g--h-|', {
        values: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 }
      });
      const stream = outer.map(x => {
        if (x === 'A') {
          return periodic.map(i => i * 10);
        } else if (x === 'B') {
          return periodic.map(i => i * 100);
        } else if (x === 'C') {
          return periodic.map(i => i * 1000);
        } else {
          return xs.never();
        }
      }).flatten();
      const expected = [10, 20, 30, 400, 500, 600, 7000, 8000];

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

    it('should not restart inner stream if switching to the same inner stream', (done) => {
      const outer = fromDiagram('-A---------B----------C--------|');
      const nums = fromDiagram(  '-a-b-c-----------------------|', {
        values: {a: 1, b: 2, c: 3}
      });
      const inner = nums.map(x => 10 * x);

      const stream = outer.map(() => inner).flatten();

      const expected = [10, 20, 30];

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

    it('should not run multiple executions of the inner', (done) => {
      const inner = xs.periodic(350).take(2).map(i => i * 100);
      const outer = xs.periodic(200).take(4);
      const stream = outer.map(() => inner).flatten();

      const expected = [0, 100];
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

    it('should not restart inner stream if switching to the same inner stream', (done) => {
      const outer = fromDiagram('-A---------B----------C--------|');
      const nums = fromDiagram(  '-a-b-c-----------------------|', {
        values: {a: 1, b: 2, c: 3}
      });
      const inner = nums.map(x => 10 * x);

      const stream = outer.mapTo(inner).flatten();

      const expected = [10, 20, 30];

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
  });
});
