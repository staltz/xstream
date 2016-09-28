/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Listener, Producer} from '../../src/index';
import debounce from '../../src/extra/debounce';
import * as assert from 'assert';

describe('debounce (extra)', () => {
  it('should delay events until a period of silence has passed', (done) => {
    const producer: Producer<number> = {
      start(out: Listener<number>) {
        out.next(1);
        out.next(2);
        out.next(5);
      },
      stop() {}
    };
    const stream = xs.create(producer).compose(debounce(100));
    const expected = [5];
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
