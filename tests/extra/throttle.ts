/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Listener, Producer} from '../../src/index';
import throttle from '../../src/extra/throttle';
import * as assert from 'assert';

describe('throttle (extra)', () => {
  it('should emit event and drop subsequent events until a period of silence has passed', (done) => {
    const producer: Producer<number> = {
      start(out: Listener<number>) {
        out.next(1);
        out.next(2);
        setTimeout(() => {
          out.next(5);
          setTimeout(() => {
            out.next(7);
            setTimeout(() => {
              out.next(9);
            }, 150)
          }, 20)
        }, 200)
      },
      stop() { }
    };
    const stream = xs.create(producer).compose(throttle(100));
    const expected = [1, 5, 9];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: (err: Error) => done(err),
      complete: () => done(new Error('This should not be called')),
    };
    stream.addListener(listener);
  });
});
