/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';
import flattenSequentially from '../../src/extra/flattenSequentially';
import * as assert from 'assert';

describe('flattenSequentially (extra)', () => {
  describe('with map', () => {
    it('should expand each periodic event with 3 sync events', (done) => {
      const stream = xs.periodic(100).take(3)
        .map(i => xs.of(1 + i, 2 + i, 3 + i))
        .compose(flattenSequentially);
      const expected = [1, 2, 3, 2, 3, 4, 3, 4, 5];
      const listener = {
        next: (x: number) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        },
      };
      stream.addListener(listener);
    });

    it('should expand each sync event as a periodic stream and concatenate', (done) => {
      const stream = xs.of(1, 2, 3)
        .map(i => xs.periodic(100).take(3).map(x => `${i}${x}`))
        .compose(flattenSequentially);
      const expected = ['10', '11', '12', '20', '21', '22', '30', '31', '32'];
      const listener = {
        next: (x: string) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        },
      };
      stream.addListener(listener);
    });

    it('should expand 3 sync events as a periodic each', (done) => {
      const stream = xs.of(1, 2, 3)
        .map(i => xs.periodic(100 * i).take(2).map(x => `${i}${x}`))
        .compose(flattenSequentially);
      // ---x---x---x---x---x---x
      // ---10--11
      //         -------20------21
      //                         -----------30----------31
      const expected = ['10', '11', '20', '21', '30', '31'];
      const listener = {
        next: (x: string) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        },
      };
      stream.addListener(listener);
    });

    it('should expand 3 async events as a periodic each', (done) => {
      const stream = xs.periodic(140).take(3)
        .map(i =>
          xs.periodic(100 * (i < 2 ? 1 : i)).take(3).map(x => `${i}${x}`)
        )
        .compose(flattenSequentially);
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //             ----10--11--12
      //                          ------------20-----------21----------22
      const expected = ['00', '01', '02', '10', '11', '12', '20', '21', '22'];
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
        .filter(() => true) // breaks an optimization map+flattenSequentially
        .compose(flattenSequentially);
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //             ----10--11--12
      //                          ------------20-----------21----------22

      const expected = ['00', '01', '02', '10', '11', '12', '20', '21', '22'];
      const listener = {
        next: (x: string) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        }
      };
      stream.addListener(listener);
    });

    it('should propagate user mistakes in project as errors', (done) => {
      const source = xs.periodic(30).take(1);
      const stream = source.map(
        x => {
          const y = (<string> <any> x).toLowerCase();
          return xs.of(y);
        }
      ).compose(flattenSequentially);

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
});
