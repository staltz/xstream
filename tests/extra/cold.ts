/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';
import cold from '../../src/extra/cold';
import * as assert from 'assert';

describe.only('cold (extra)', () => {
  it('should push values to a listener', (done) => {
    const stream = xs.periodic(100).take(3).compose(cold);

    const expected = [0, 1, 2];
    const listener = {
      next (x: number) {
        assert(x === expected.shift());
      },
      error: done,
      complete () {
        assert(expected.length === 0);
        stream.removeListener(listener);
        done();
      }
    };

    stream.addListener(listener);
  });

  it('should restart the producer for every new listener', (done) => {
    const stream = xs.periodic(100).take(3).compose(cold);

    const expected = {
      one: [0, 1, 2],
      two: [0, 1, 2],
      three: [0, 1, 2]
    }

    function makeListener (arr: Array<number>) {
      const listener = {
        next (x: number) {
          console.log(x);
          assert(x === arr.shift());
        },
        error: done,
        complete () {
          assert(arr.length === 0);
          stream.removeListener(listener);
          if (arr == expected.three) {
            done();
          }
        }
      };
      return listener;
    }

    stream.addListener(makeListener(expected.one));
    stream.addListener(makeListener(expected.two));
    setTimeout(() => stream.addListener(makeListener(expected.three)), 110);
  })
});
