/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream} from '../../src/index';
import split from '../../src/extra/split';
import concat from '../../src/extra/concat';
import * as assert from 'assert';

describe('split (extra)', () => {
  it('should split a stream using a separator stream', (done) => {
    const source = xs.periodic(50).take(10);
    const separator = concat(xs.periodic(167).take(2), xs.never());
    const stream = source.compose(split(separator));
    const outerExpected = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8, 9]
    ];

    stream.addListener({
      next: (inner: Stream<number>) => {
        const innerExpected = outerExpected.shift();
        inner.addListener({
          next: (x: number) => {
            if (innerExpected) {
              assert.equal(x, innerExpected.shift());
            } else {
              assert.fail('innerExpected should be defined');
            }
          },
          error: (err: any) => done(err),
          complete: () => {
            if (innerExpected) {
              assert.equal(innerExpected.length, 0);
            } else {
              assert.fail('innerExpected should be defined');
            }
          }
        });
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(outerExpected.length, 0);
        done();
      },
    });
  });

  it('should be canceled out if flattened immediately after', (done) => {
    const source = xs.periodic(50).take(10);
    const separator = concat(xs.periodic(167).take(2), xs.never());
    const stream = source.compose(split(separator)).flatten();
    const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

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

  it('should complete when the separator completes', (done) => {
    const source = xs.periodic(50).take(10);
    const separator = xs.periodic(167).take(2);
    const stream = source.compose(split(separator)).flatten();
    const expected = [0, 1, 2, 3, 4, 5];

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
