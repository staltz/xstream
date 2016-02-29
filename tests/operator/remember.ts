import xs from '../../src/index';
import {emptyObserver} from '../../src/utils/emptyObserver';
import * as assert from 'assert';

describe.only('Stream.prototype.remember', () => {
  it('should replay the last event to a new observer', (done) => {
    const stream = xs.interval(1).take(6).remember();

    stream.subscribe(emptyObserver);

    setTimeout(() => {
      stream.subscribe({
        next(value) {
          assert.strictEqual(value, 5);
        },
        error: done.fail,
        end: () => done(),
      });
    }, 15);
  });
});
